import { useMemo, useState } from 'react'
import { Plot } from '../components/SimulationPanel'
import { defaultOptions, hosts } from '../simulation/metachronic/plant'
import type { Options } from '../simulation/metachronic/plant'
import { compareInstallation, installations } from '../simulation/metachronic/installation'
import { machineRoute, machines } from '../machines/profiles'
import type { DisplayProfile } from '../machines/profiles'
import { InspectionViewport } from './AssemblyComparison'

const meProfile:DisplayProfile={...machines.me01,href:path=>machineRoute('me01',path)}

export default function Installation(){
  const [host,setHost]=useState<Options['host']>('dynamometer')
  const [rpm,setRpm]=useState(1500)
  const [model,setModel]=useState(false)
  const study=useMemo(()=>compareInstallation(host,rpm),[host,rpm])
  const channels=[
    {name:'Direct host drive',data:study.base.map(x=>x.rpm),color:'#a15320'},
    {name:'ME-01 · nominal pitch',data:study.nominal.map(x=>x.secondaryRpm),color:'#155d89'},
    {name:'ME-01 · 8° pitch',data:study.alternative.map(x=>x.secondaryRpm),color:'#2a7440'},
  ]
  return <>
    <header className="page-header"><div><div className="eyebrow">SYSTEM INTEGRATION / ME-01</div>
      <h1>Host Installation Laboratory</h1><p>Calculated response of a direct-drive reference and two ME-01 configurations at a shared external load boundary.</p></div></header>
    <div className="study-layout">
      <aside className="panel study-parameters">
        <div className="panel-title"><h2>Installation inputs</h2></div>
        <div className="study-inputs">
          <label>External load model<select value={host} onChange={event=>setHost(event.target.value as Options['host'])}>
            {Object.entries(hosts).map(([id,value])=><option key={id} value={id}>{value.label}</option>)}</select></label>
          <label>Speed request <output>{rpm} rpm</output><input aria-label="Installation speed request" type="range" min="300" max="2200" step="25" value={rpm} onChange={event=>setRpm(+event.target.value)}/></label>
          <button type="button" className="secondary-button" aria-pressed={model} onClick={()=>setModel(!model)}>Installation reference geometry</button>
          <a className="primary-button" href={machineRoute('me01',`simulation/${host}`)}>Run this load with the live assembly</a>
        </div>
      </aside>
      <div className="study-results">
        <section className="panel article-panel doc-prose">
          <h2>{installations[host].media}</h2><p>{installations[host].load}</p>
          <ol className="signal-path" aria-label="Installation interface"><li>36 V reference drive</li><li>Optional ME-01 coupling</li><li>External shaft load</li></ol>
          <dl>
            <dt>Mechanical interface</dt><dd>Same modeled host inertia ({study.assumedInertia.toFixed(4)} kg·m²) and torque law in every case. ME-006 and ME-030 define the secondary shaft and output datum. Host mounting, shaft adapter and containment remain open.</dd>
            <dt>Electrical interface</dt><dd>36 V DC reference, current and torque limited. The selected host exchanges shaft effort only.</dd>
            <dt>Control interface</dt><dd>Common speed request. Regeneration is disabled during the comparison. Pitch commands are {defaultOptions.pitch}° and 8°.</dd>
            <dt>Thermal interface</dt><dd>ME-01 thermal nodes remain internal. The host boundary supplies torque and inertia with no heat transfer across the modeled interface.</dd>
          </dl>
        </section>
        <Plot provenance="simulation" data={{title:'Host shaft response',unit:'rpm',xLabel:'Time (s)',x:study.nominal.map(x=>x.t),
          series:channels.map(series=>({...series,data:study.nominal.map((_,i)=>series.data[i]??null)}))}} />
      </div>
    </div>
    {model&&<div className="diagnostic-model"><InspectionViewport machine={meProfile} fraction={0} preset="Iso" cameraTick={0}/></div>}
  </>
}
