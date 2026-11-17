import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Activity, FlaskConical, Play, Pause } from 'lucide-react'
import { Plot } from '../components/SimulationPanel'
import type { ViewerProps } from '../components/Viewer3D'
import { dynamicFaults, hosts, me01Simulation, defaultOptions } from '../simulation/metachronic/plant'
import type { Options } from '../simulation/metachronic/plant'
import { useMachine } from '../machines/context'

type DisplayTelemetry=Pick<ViewerProps,'speedRpm'|'secondaryRpm'|'shaftPhaseRad'|'bladePitch'|'fanRpm'|'fanRunning'|'motorTemperature'|'vibrationUm'>
type Num = { [K in keyof Options]: Options[K] extends number ? K : never }[keyof Options]
const parameters: [Num,string,string,number,number,number][] = [
  ['rpm','Primary speed request','rpm',300,2200,25],['torque','Torque ceiling','N·m',.1,.65,.01],
  ['pitch','Vane pitch command','°',2,24,1],['imbalance','Shaft residual unbalance','g·mm',0,38,1],
  ['stiffness','Lateral stiffness','N/m',17000,55000,500],['damping','Lateral damping','N·s/m',12,70,1],
  ['gain','Radial gain limit','ratio',0,2.2,.05],['coupling','Coupling stiffness','N·m/rad',3,12,.1],
  ['torsion','Torsional damping','N·m·s/rad',.022,.15,.001],['fan','Independent fan demand','ratio',0,1,.02],
  ['ambient','Inlet temperature','°C',12,43,1],['throttle','Loop valve opening','ratio',0,1,.02],
  ['head','Loop pressure head','kPa',1,54,1],['load','External load torque','N·m',0,.12,.002],
]
const fmt=(n:number,unit:string)=>`${Number(n.toPrecision(4))} ${unit}`

export default function MetachronicLab({view}:{view:(telemetry:DisplayTelemetry)=>ReactNode}) {
  const machine=useMachine()
  const [options,setOptions]=useState(defaultOptions)
  const [time,setTime]=useState(0)
  const [running,setRunning]=useState(false)
  const [showModel,setShowModel]=useState(false)
  const [chart,setChart]=useState('Shaft speeds')
  const rows=useMemo(()=>me01Simulation(options),[options])
  const active=running&&time<9
  useEffect(()=>{
    if(!active)return
    const timer=window.setInterval(()=>setTime(v=>Math.min(9,v+.05)),50)
    return ()=>window.clearInterval(timer)
  },[active])
  const a=rows[Math.round(time/9*(rows.length-1))]
  const cards=[
    ['Controller',a.mode],['Primary / secondary',`${Math.round(a.rpm)} / ${Math.round(a.secondaryRpm)} rpm`],
    ['Relative phase',fmt(a.phaseRad,'rad')],['Coupling torque',fmt(a.torque,'N·m')],['Vibration',fmt(a.vibration,'µm')],
    ['Radial actuation',fmt(a.actuator,'N')],['Pressure / flow',`${fmt(a.pressure/1000,'kPa')} · ${fmt(a.flow*1e6,'mL/s')}`],
    ['Motor / bearing',`${a.motor.toFixed(1)} / ${a.bearing.toFixed(1)} °C`],['Drive + radial input',fmt(a.busPower,'W')],
    ['DC-link voltage',fmt(a.busV,'V')],['Recovered power',fmt(a.regenW,'W')],['Energy residual',fmt(a.audit,'J')],
  ]
  type Reading=typeof a
  const charts:Record<string,{unit:string,tracks:[keyof Reading,string][]}>={
    'Shaft speeds':{unit:'rpm',tracks:[['rpm','Primary shaft'],['secondaryRpm','Secondary shaft']]},
    'Relative phase':{unit:'rad',tracks:[['phaseRad','Phase difference']]},
    'Transverse motion':{unit:'µm',tracks:[['vibration','Radial displacement magnitude']]},
    'Thermal response':{unit:'°C',tracks:[['motor','Motor node'],['bearing','Journal node']]},
    'Power transfer':{unit:'W',tracks:[['busPower','Drive plus radial input'],['regenW','Recovered DC-link power']]},
    'Loop delivery':{unit:'mL/s',tracks:[['flow','Coolant circuit']]},
  }
  const selected=charts[chart]
  return <>
    <header className="page-header"><div><div className="eyebrow">{machine.name} {machine.code} / COUPLED STATE MODEL</div>
      <h1>Polychronous Operating Laboratory</h1><p>Dual-shaft response, hydrocoptic loading, signed DC power and orthogonal stabilization.</p></div></header>
    <div className="document-tabs"><a href={machine.href('systems')}>Scientific subsystem register</a><a href={machine.href('engineering/physics')}>Model equations</a><a href={machine.href('installation')}>Host installation laboratory</a></div>
    <div className="study-layout">
      <aside className="panel study-parameters">
        <div className="panel-title"><FlaskConical size={16}/><h2>Test conditions</h2></div>
        <div className="study-inputs">
          <label>External load boundary<select value={options.host} onChange={e=>setOptions(o=>({...o,host:e.target.value as Options['host']}))}>
            {Object.entries(hosts).map(([id,value])=><option key={id} value={id}>{value.label}</option>)}</select></label>
          <label>Fault scenario<select value={options.fault} onChange={e=>{setOptions(o=>({...o,fault:e.target.value as Options['fault']}));setTime(0)}}>
            {dynamicFaults.map(fault=><option key={fault}>{fault}</option>)}</select></label>
          <label>Regenerative deceleration<input type="checkbox" checked={options.regen} onChange={e=>setOptions(o=>({...o,regen:e.target.checked}))}/></label>
          <details open><summary>Drive, vane and fluid parameters</summary>
            <div className="me-parameters">
              {parameters.map(([key,label,unit,min,max,step])=><label key={key}>{label} <output>{fmt(options[key],unit)}</output>
                <input aria-label={label} type="range" value={options[key]} min={min} max={max} step={step}
                  onChange={event=>setOptions(o=>({...o,[key]:Number(event.target.value)}))}/></label>)}
            </div>
          </details>
        </div>
      </aside>
      <div className="study-results">
        <section className="panel study-readings">
          <div className="panel-title"><Activity size={16}/><h2>Operating record</h2><span className="data-tag">Simulation</span></div>
          <div className="timeline">
            <button type="button" className="icon-button" aria-label={active?'Pause run':'Start run'} onClick={()=>{
              if(!active&&time>=9)setTime(0)
              setRunning(!active)
            }}>{active?<Pause size={15}/>:<Play size={15}/>}</button>
            <label htmlFor="me-time">Time</label><input id="me-time" type="range" min="0" max="9" step=".025" value={time}
              onChange={event=>{setTime(Number(event.target.value));setRunning(false)}}/><output htmlFor="me-time">{time.toFixed(2)} s</output>
            <button type="button" className="secondary-button" aria-pressed={showModel} onClick={()=>setShowModel(!showModel)}>Motion replay</button>
          </div>
          <dl>{cards.map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
          <p>{a.fault? `Active condition · ${a.fault}`:'The test introduces the selected fault at 3 s and commands regenerative deceleration at 6 s.'}</p>
        </section>
        <div className="document-tabs" role="group" aria-label="Time-series channels">{Object.keys(charts).map(key=><button key={key} type="button"
          aria-pressed={chart===key} onClick={()=>setChart(key)}>{key}</button>)}</div>
        <Plot provenance="simulation" data={{title:chart,x:rows.map(row=>row.t),xLabel:'Time (s)',unit:selected.unit,
          series:selected.tracks.map(([key,name],i)=>({name,data:rows.map(row=>Number(row[key])*(key==='flow'?1e6:1)),color:i?'#9a5a1a':'#225b89'}))}}/>
      </div>
    </div>
    {showModel && <div className="diagnostic-model">{view({speedRpm:a.rpm,secondaryRpm:a.secondaryRpm,shaftPhaseRad:a.phaseRad,
      bladePitch:a.pitch,fanRpm:a.cooling>0?1700*options.fan:0,fanRunning:a.cooling>0,motorTemperature:a.motor,vibrationUm:a.vibration})}</div>}
  </>
}
