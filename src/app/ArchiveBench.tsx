import { useEffect, useId, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Plot } from '../components/SimulationPanel'
import type { ArchiveStudy } from '../machines/archive'
import { archiveStudies, runArchiveStudy } from '../simulation/archive'
import type { ArchiveFrame } from '../simulation/archive'

export default function ArchiveBench({kind,model}:{kind:ArchiveStudy;model?:(frame:ArchiveFrame)=>ReactNode}) {
  const config=archiveStudies[kind]
  const defaults=()=>config.inputs.map(input=>input.initial)
  const [values,setValues]=useState(defaults)
  const [fault,setFault]=useState(false)
  const [running,setRunning]=useState(false)
  const [cursor,setCursor]=useState(0)
  const [rate,setRate]=useState(1)
  const [motion,setMotion]=useState(false)
  const field=useId()
  const study=useMemo(()=>runArchiveStudy(kind,values,fault),[kind,values,fault])
  const last=study.frames.length-1
  const finished=cursor>=last
  const frame=study.frames[cursor]
  useEffect(()=>{
    if(!running||finished)return
    const timer=setInterval(()=>setCursor(previous=>Math.min(last,previous+1)),50/rate)
    return ()=>clearInterval(timer)
  },[running,finished,last,rate])
  const save=()=>{
    const rows=[['Time (s)',...study.names.map(name=>name+' ('+study.unit+')')],...study.frames.map(item=>[item.time,...item.values])]
    const url=URL.createObjectURL(new Blob([rows.map(row=>row.join(',')).join('\n')],{type:'text/csv'}))
    const link=document.createElement('a')
    link.href=url
    link.download=kind+'-calculated-samples.csv'
    link.click()
    setTimeout(()=>URL.revokeObjectURL(url),0)
  }
  return <>
    <div className="study-layout">
      <aside className="panel study-parameters" aria-label="Operating parameters">
        <div className="panel-title"><h2>Input assumptions</h2></div>
        <div className="study-inputs">
          {config.inputs.map((input,i)=><label key={input.name}>
            <span>{input.name} <small>{input.unit}</small></span><output>{values[i]}</output>
            <input aria-label={input.name} type="range" min={input.min} max={input.max} step={input.step} value={values[i]} onChange={event=>{
              const value=Number(event.target.value)
              setValues(old=>old.map((x,j)=>i===j?value:x))
            }}/>
          </label>)}
          <label className="inline-control">Inject operating disturbance<input type="checkbox" checked={fault} onChange={event=>setFault(event.target.checked)}/></label>
          <label className="inline-control">Replay rate<select value={rate} onChange={event=>setRate(+event.target.value)}>
            <option value=".5">0.5×</option><option value="1">1×</option><option value="2">2×</option>
          </select></label>
          <p>{config.assumptions}</p>
        </div>
      </aside>
      <div className="study-results">
        <section className="panel study-readings replay">
          <div className="panel-title"><h2>{config.title}</h2><span className="data-tag">Numerical study</span></div>
          <div className="study-equation">{config.equation}</div>
          <ol className="signal-path" aria-label="Functional signal path">{config.stages.map(stage=><li key={stage}>{stage}</li>)}</ol>
          <div className="timeline">
            <label htmlFor={field}>Time</label><input id={field} type="range" min="0" max={last} step="1" value={cursor} aria-valuetext={frame.time.toFixed(2)+' seconds'} onChange={event=>{setRunning(false);setCursor(+event.target.value)}}/>
            <output htmlFor={field}>{frame.time.toFixed(2)} s</output>
          </div>
          <div className="archive-actions">
            <button type="button" className="secondary-button" onClick={()=>{if(finished)setCursor(0);setRunning(!(running&&!finished))}}>
              {running&&!finished?'Pause':cursor===0||finished?'Start':'Resume'}
            </button>
            <button type="button" className="secondary-button" disabled={finished} onClick={()=>{setRunning(false);setCursor(cursor+1)}}>Single step</button>
            <button type="button" className="secondary-button" onClick={()=>{setRunning(false);setCursor(0);setValues(defaults());setFault(false);setRate(1)}}>Reset</button>
            <button type="button" className="secondary-button" onClick={save}>Download samples</button>
            {model&&<button type="button" className="secondary-button" aria-pressed={motion} onClick={()=>setMotion(!motion)}>Motion replay</button>}
          </div>
          <p role="status">{frame.status}</p>
          <dl>{study.names.map((name,i)=><div key={name}><dt>{name}</dt><dd>{frame.values[i].toFixed(3)} {study.unit}</dd></div>)}</dl>
        </section>
        <Plot data={study.chart} provenance="calculated"/>
      </div>
    </div>
    {motion&&model?.(frame)}
  </>
}
