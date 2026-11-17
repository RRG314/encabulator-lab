import { Activity, AlertTriangle, FlaskConical, Play, Pause, RotateCcw } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { simulationProfiles } from '../schemas/simulation'
import { useMachine } from '../machines/context'
import type { SimulationId } from '../schemas/simulation'
import { faults } from '../simulation/plant'
import type { Fault } from '../simulation/plant'
import { study } from '../simulation/studies'
import type { Chart } from '../simulation/studies'
import type { ViewerProps } from './Viewer3D'

const digits = (v:number) => Number(v.toPrecision(3)).toString()
const timeFormat = (t:number) => `${t.toFixed(2)} s`

export function Plot({ data, provenance }: { data: Chart, provenance:string }) {
  const values = data.series.flatMap(item => item.data.filter((value): value is number => value !== null && Number.isFinite(value)))
  const low = Math.min(...values)
  const span = Math.max(...values)-low
  const min = low - (span || Math.max(0.1,Math.abs(low)/10)) * 0.09
  const max = low + (span ? span*1.09 : Math.max(0.1,Math.abs(low)/10))
  const left = 70, right = 646, top = 17, bottom = 198
  const xSpan = (data.x.at(-1) ?? 1) - data.x[0]
  const x = (v:number) => left+(v-data.x[0])*((right-left)/(xSpan || 1))
  const y = (v:number) => bottom-(v-min)*(bottom-top)/(max-min)
  return <figure className="sim-plot panel">
    <figcaption><h3>{data.title}</h3><span className="data-tag">{provenance}</span></figcaption>
    <svg viewBox="0 0 668 245" role="img" aria-label={`${provenance} plot of ${data.title} in ${data.unit}`}>
      {[0,1,2,3,4].map(tick => {
        const value = min+tick*(max-min)/4
        const X = left+tick*(right-left)/4
        return <g key={tick}>
          <path d={`M${left} ${y(value)}H${right} M${X} ${top}V${bottom}`} />
          <text textAnchor="end" x={left-7} y={y(value)+3}>{digits(value)}</text>
          <text textAnchor="middle" x={X} y={bottom+16}>{digits(data.x[0]+tick*xSpan/4)}</text>
        </g>
      })}
      <text x={left-53} y={top+4}>{data.unit}</text>
      <text textAnchor="middle" x={(left+right)/2} y={bottom+36}>{data.xLabel}</text>
      {data.series.map(item => {
        let start = true
        const d = item.data.map((value,i) => {
          if (value === null || !Number.isFinite(value)) { start = true; return '' }
          const point = `${start ? 'M' : 'L'}${x(data.x[i]).toFixed(2)} ${y(value).toFixed(2)}`
          start = false
          return point
        }).join('')
        return <path key={item.name} d={d} style={{stroke:item.color ?? '#1f638e',strokeWidth:2.1}} vectorEffect="non-scaling-stroke" />
      })}
    </svg>
    <div className="plot-legend">{data.series.map(item => <span key={item.name}><i style={{background:item.color ?? '#1f638e'}} />{item.name}</span>)}</div>
    <details className="plot-data"><summary>Sampled values</summary>
      <div className="table-scroll"><table><thead><tr><th scope="col">{data.xLabel}</th>{data.series.map(item => <th scope="col" key={item.name}>{item.name} ({data.unit})</th>)}</tr></thead>
        <tbody>{data.x.map((v,i) => ({v,i})).filter(({i}) => i % Math.max(1,Math.floor(data.x.length/10)) === 0 || i === data.x.length-1)
          .map(({v,i}) => <tr key={i}><td>{digits(v)}</td>{data.series.map(item => <td key={item.name}>{item.data[i] === null ? 'Unavailable' : digits(item.data[i])}</td>)}</tr>)}</tbody>
      </table></div>
    </details>
  </figure>
}

type Telemetry = Pick<ViewerProps, 'speedRpm' | 'motorTemperature' | 'fanRunning' | 'vibrationUm'>

function StudyControls({ id, diagnostic }: { id:SimulationId, diagnostic?: (telemetry:Telemetry) => ReactNode }) {
  const machine=useMachine()
  const model = simulationProfiles[machine.key].find(item => item.id === id)!
  const defaults = () => Object.fromEntries(model.inputs.map(input => [input.id,input.default]))
  const [params,setParams] = useState(defaults)
  const [fault,setFault] = useState<Fault>('None')
  const [dropout,setDropout] = useState(false)
  const [playing,setPlaying] = useState(false)
  const [moment,setMoment] = useState(0)
  const results = useMemo(() => study(id,params,fault,dropout,machine.key),[id,params,fault,dropout,machine.key])
  useEffect(() => {
    if (!playing) return
    const trigger = setInterval(() => setMoment(t => Math.min(10,t+0.1)), 100)
    return () => clearInterval(trigger)
  }, [playing])
  const data = results.telemetry
  const reading = data?.[Math.round((data.length-1)*moment/10)]
  const reset = () => { setParams(defaults()); setFault('None'); setDropout(false); setMoment(0); setPlaying(false) }
  return <>
    <div className="study-layout">
      <aside className="panel study-parameters" aria-label="Study parameters">
        <div className="panel-title"><FlaskConical size={16} /><h2>Input assumptions</h2><button type="button" className="icon-button" onClick={reset} aria-label="Reset inputs"><RotateCcw size={14} /></button></div>
        <div className="study-inputs">
          {model.inputs.map(input => <label key={input.id} htmlFor={`input-${input.id}`}>
            <span>{input.label} <small>{input.unit}</small></span>
            <output htmlFor={`input-${input.id}`}>{params[input.id]}</output>
            <input id={`input-${input.id}`} type="range" value={params[input.id]} min={input.min} max={input.max} step={input.step}
              onChange={event => setParams(previous => ({...previous,[input.id]:Number(event.target.value)}))} />
          </label>)}
          {id==='phase' && <label className="inline-control">Inject missing samples<input type="checkbox" checked={dropout} onChange={event => setDropout(event.target.checked)} /></label>}
          {id==='integrated' && <label className="inline-control">Fault scenario<select value={fault} onChange={event => { setFault(event.target.value as Fault);setMoment(0);setPlaying(false) }}>
            {faults.map(scenario => <option key={scenario}>{scenario}</option>)}
          </select></label>}
          <p>{model.assumptions}</p>
        </div>
      </aside>
      <div className="study-results">
        <section className="panel study-readings" aria-label="Calculated readings">
          <div className="panel-title"><Activity size={16} /><h2>{model.name}</h2><span className="data-tag">{model.provenance}</span></div>
          <div className="study-equation">{model.equation}</div>
          <dl>{results.readings.map(([key,value]) => <div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl>
          {results.note && <p>{results.note}</p>}
        </section>
        {reading && <section className="panel study-readings replay">
          <div className="panel-title"><Activity size={16} /><h2>Telemetry replay</h2><span className="data-tag">simulation</span></div>
          <div className="timeline">
            <button className="icon-button" type="button" aria-label={playing && moment < 10 ? 'Pause replay' : 'Play replay'} onClick={() => {
              if (playing && moment < 10) setPlaying(false)
              else { if (moment >= 10) setMoment(0);setPlaying(true) }
            }}>{playing && moment<10 ? <Pause size={15} /> : <Play size={15} />}</button>
            <label htmlFor="replay-time">Time</label><input id="replay-time" type="range" min="0" max="10" step="0.02" value={moment}
              onChange={event => {setPlaying(false);setMoment(Number(event.target.value))}} /><output htmlFor="replay-time">{timeFormat(moment)}</output>
          </div>
          <dl>{[
            ['Speed',`${reading.rpm.toFixed(0)} rpm`],['Bus',`${reading.voltage.toFixed(1)} V · ${reading.current.toFixed(2)} A`],
            ['Motor',`${reading.motor.toFixed(1)} °C`],['Vibration',`${reading.vibrationUm.toFixed(1)} µm`],
            ['Airflow',`${(reading.flow*1000).toFixed(1)} L/s`],['Phase',reading.phaseQualified ? 'Eligible' : 'Inhibited'],
          ].map(([key,value]) => <div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl>
          {reading.inhibited && <p role="status"><AlertTriangle size={14} /> {reading.reason || 'Fault latched'} · drive inhibited</p>}
          {!diagnostic && <a className="replay-link" href={machine.href('diagnostics')}>Open 3D diagnostic replay</a>}
        </section>}
        {!diagnostic && results.charts.map(data => <Plot key={data.title} data={data} provenance={model.provenance} />)}
      </div>
    </div>
    {reading && diagnostic && <div className="diagnostic-model">{diagnostic({speedRpm:reading.rpm,motorTemperature:reading.motor,
      fanRunning:reading.flow>0,vibrationUm:reading.vibrationUm})}</div>}
  </>
}

export default function SimulationPanel({ initial, diagnostic, lab }: { initial?:SimulationId, diagnostic?: (telemetry:Telemetry) => ReactNode;lab?:ReactNode }) {
  const machine=useMachine()
  const [active,setActive] = useState<SimulationId>(() => initial ?? 'rotor')
  return <>
    <header className="page-header"><div><div className="eyebrow">{machine.name} {machine.code} / {diagnostic ? 'OPERATING STATE' : 'MODEL STUDIES'}</div>
      <h1>{diagnostic ? 'Diagnostic replay' : 'Dynamic Test Bench'}</h1>
      <p>{diagnostic ? 'Review the simulated plant state on the assembly.' : 'Operate the assembly under adjustable loads, then inspect its calculated response.'}</p></div></header>
    {lab}
    {!diagnostic && <nav className="document-tabs" aria-label="Simulation studies">
      {simulationProfiles[machine.key].map(model => <button key={model.id} type="button" aria-pressed={active === model.id}
        onClick={() => setActive(model.id)}>{model.name}</button>)}
    </nav>}
    <StudyControls key={active} id={active} diagnostic={diagnostic} />
  </>
}
