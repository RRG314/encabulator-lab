import AssemblyComparison from "./AssemblyComparison"
import { useEffect, useState } from 'react'
import { assetUrl, machineRoute, machines } from '../machines/profiles'
import { me01Simulation, defaultOptions } from '../simulation/metachronic/plant'
import { automate, benchProfiles } from '../simulation/automation'

const samples=Object.values(machines).slice(0,2).map(machine=>automate({run:true, voltage:machine.voltage,rpm:1500,
  fan:.72,fault:'None',pressureHeadKPa:18,loadNm:benchProfiles[machine.key].load},machine.key).at(-1)!)
const me=me01Simulation({...defaultOptions,rpm:1500,regen:false},.002,10).at(-1)!
const basis=[
  ['Baseplate study envelope','300 × 200 × 6 mm','488 × 350 × 10 mm', '620 × 412 × 12 mm'],
  ['Journal and span','8 mm · 96 mm','12 mm · 164 mm', '13 mm primary · 263 mm journal span'],
  ['Candidate DC system','24 V class','48 V class', '36 V class'],
  ['Main rotor','6 radial vane inserts','6 pitched marzelvanes with keeper rings', '6 variable-pitch marzelvanes'],
  ['Transmission','Fixed flexible shaft coupling','Differential girdle-spring cartridge', 'Dual concentric shafts and compliant torsional coupling'],
  ['Cooling','Independent axial fan and duct','Independent shrouded fan, filter and exhaust transition', 'Independent fan and metered thermal loop'],
  ['Supervisory control','Bench drive and instrumentation','Finned drive, control cabinet, field I/O and stop latch', 'Radial compensation and regenerative supervisory control'],
  ['Instrumentation','Speed, temperature, vibration, current and voltage','Synchronous timebase plus reciprocating-loop provisions', 'Synchronized dual shaft, phase, pressure and vibration telemetry'],
  ['Working load','Ventilated rotor drag','Rotor drag and low-head water delivery', 'Variable-pitch test element and selectable shaft loads'],
  ['Qualified interchangeability','Pending component selection','Pending component selection', 'Pending component selection'],
  ['Revision','0.1','0.1', '0.1'],
]
export default function Comparison() {
  const [masses,setMasses]=useState<(number|null)[]>([null,null,null])
  useEffect(()=>{
    const controller=new AbortController()
    void Promise.all(Object.values(machines).map(async machine=>{
      try {
        const response=await fetch(assetUrl(`${machine.assetFolder}/validation.json`),{signal:controller.signal})
        if(!response.ok) return null
        const report=await response.json() as {estimatedMassKg?:number}
        return report.estimatedMassKg??null
      } catch { return null }
    })).then(result=>{if(!controller.signal.aborted)setMasses(result)})
    return ()=>controller.abort()
  },[])
  return <>
    <header className="page-header"><div><div className="eyebrow">CONFIGURATION CONTROL</div>
      <h1>Machine Configuration Comparison</h1><p>Common engineering principles, independent hardware definitions.</p></div>
      <a className="secondary-button" href={machineRoute('me01','installation')}>Host installation laboratory</a></header>
    <AssemblyComparison />
    <article className="panel article-panel doc-prose">
      <div className="table-scroll"><table aria-label="Machine design comparison">
        <thead><tr><th scope="col">Interface</th>{Object.values(machines).map(machine=><th scope="col" key={machine.key}>
          <a href={machineRoute(machine.key,'explorer')}>{machine.name} {machine.code}</a></th>)}</tr></thead>
        <tbody>{basis.map(([label,te,re,me])=><tr key={label}><th scope="row">{label}</th><td>{te}</td><td>{re}</td><td>{me}</td></tr>)}
          <tr><th scope="row">Estimated CAD mass</th>{masses.map((value,i)=><td key={i}>{value===null?'Pending material definition':`${value.toFixed(3)} kg · schematic density estimate`}</td>)}</tr>
        </tbody>
      </table></div>
      <h2>Common setpoint study</h2>
      <p>Simulated 10 s run at a 1,500 rpm request and 72% fan command. Each machine uses its own voltage, inertia, drive constants and external load.</p>
      <div className="table-scroll"><table aria-label="Simulated performance comparison"><thead><tr><th scope="col">Output</th><th scope="col">Turbo Encabulator TE-01</th><th scope="col">Retro Encabulator RE-01</th><th scope="col">Metachronic Encabulator ME-01</th></tr></thead>
        <tbody>{[
          ['Shaft speed',...samples.map(p=>`${p.rpm.toFixed(0)} rpm`),`${me.rpm.toFixed(0)} rpm`],
          ['Bus current',...samples.map(p=>`${p.current.toFixed(2)} A`),`${me.current.toFixed(2)} A`],
          ['Motor temperature',...samples.map(p=>`${p.motor.toFixed(2)} °C`),`${me.motor.toFixed(2)} °C`],
          ['Water delivery','Not applicable',`${(samples[1].waterFlow*60000).toFixed(3)} L/min`,`${(me.flow*60000).toFixed(3)} L/min · coolant`],
         ].map(([label,te,re,met])=><tr key={label}><th scope="row">{label}</th><td>{te}</td><td>{re}</td><td>{met}</td></tr>)}</tbody></table></div>
      <a href={machineRoute('re01','engineering/interchangeability')}>Component interchangeability catalogue</a>
    </article>
  </>
}
