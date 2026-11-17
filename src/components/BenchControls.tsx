import { useEffect, useState } from 'react'
import { Activity, Play, Square, RotateCcw } from 'lucide-react'
import { useMachine } from '../machines/context'
import { benchProfiles, benchReading, benchStep, initialBench } from '../simulation/automation'
import type { BenchCommand } from '../simulation/automation'

export function useBench() {
  const machine=useMachine()
  const [requested,setRequested]=useState<BenchCommand>(()=>({run:false,rpm:machine.key==='re01'?1550:1450,
    voltage:machine.voltage,fan:.72,fault:'None',pressureHeadKPa:18,loadNm:benchProfiles[machine.key].load}))
  const [sample,setSample]=useState(initialBench)
  const clocked=requested.run || sample.w>0.25 || (requested.fault!=='None' && !sample.latch)
  const key=machine.key
  useEffect(()=>{
    if (!clocked) return
    const timer=window.setInterval(()=>setSample(state=>{
      let next=state
      for(let i=0;i<10;i++) next=benchStep(key,next,requested)
      return next
    }),50)
    return ()=>window.clearInterval(timer)
  },[clocked,key,requested])
  const reset=()=>{
    setRequested(command=>({...command,run:false,fault:'None'}))
    setSample(initialBench)
  }
  return { requested, setRequested, reset, reading:benchReading(key,sample,requested), state:sample }
}

export function BenchControls({bench,onStart}:{bench:ReturnType<typeof useBench>,onStart:()=>void}) {
  const machine=useMachine()
  const {reading,requested,setRequested,reset,state}=bench
  return <section className="bench-console" aria-label="Interactive dynamometer">
    <header><Activity size={15}/><h3>{machine.key==='re01'?'Reciprocating Fluid-Loop Test':'Ventilated Rotor Load Test'}</h3>
      <span className="data-tag">Simulation</span></header>
    <div className="bench-settings">
      <div className="bench-actions">
        <button type="button" className="primary-button" disabled={requested.run || Boolean(state.latch)} onClick={()=>{
          onStart()
          setRequested(value=>({...value,run:true,fault:'None'}))
        }}><Play size={14}/> Start drive</button>
        <button type="button" className="secondary-button" disabled={!requested.run} onClick={()=>setRequested(c=>({...c,run:false}))}><Square size={13}/> Coast</button>
        <button type="button" className="secondary-button" onClick={()=>setRequested(c=>({...c,run:false,fault:'Guard open'}))}>Inject guard fault</button>
        <button type="button" className="icon-button" aria-label="Reset dynamometer" onClick={reset}><RotateCcw size={15}/></button>
      </div>
      <label>Speed setpoint <b>{requested.rpm} rpm</b><input aria-label="Speed setpoint" type="range" min={machine.speed[0]}
        max={machine.speed[1]} step="50" value={requested.rpm} onChange={e=>setRequested(c=>({...c,rpm:Number(e.target.value)}))}/></label>
      {machine.key==='re01' && <label>Loop head <b>{requested.pressureHeadKPa} kPa</b><input aria-label="Loop head" type="range" min="0" max="75"
        value={requested.pressureHeadKPa} onChange={e=>setRequested(c=>({...c,pressureHeadKPa:Number(e.target.value)}))}/></label>}
    </div>
    <dl className="bench-readings">
      <div><dt>Controller state</dt><dd><span role="status">{state.mode}{state.latch?` · ${state.latch}`:''}</span></dd></div>
      <div><dt>Shaft speed</dt><dd>{Math.round(reading.rpm)} rpm</dd></div>
      <div><dt>DC bus current</dt><dd>{reading.current.toFixed(2)} A</dd></div>
      <div><dt>{machine.key==='re01'?'Calculated water delivery':'Cooling airflow'}</dt><dd>{machine.key==='re01'?
        `${(reading.waterFlow*60000).toFixed(3)} L/min`:`${(reading.flow*1000).toFixed(1)} L/s`}</dd></div>
    </dl>
  </section>
}
