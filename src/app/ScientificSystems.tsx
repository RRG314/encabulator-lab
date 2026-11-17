import { useState } from 'react'
import data from '../../data/me01/scientific.json'
import { useMachine } from '../machines/context'
import { controls, scientificStudy } from '../simulation/metachronic/physics'
import { Plot } from '../components/SimulationPanel'

export default function ScientificSystems({id}:{id?:string}) {
  const machine=useMachine()
  const picked=data.find(item=>id===`ME-${String(item.number).padStart(3,'0')}`)
  const control=picked?controls[picked.number]:undefined
  const [value,setValue]=useState(control?.initial??0)
  const [q,setQuery]=useState('')
  const rows=data.filter(item=>`${item.name} ME-0${item.number} ${item.domain}`.toLowerCase().includes(q.toLowerCase().trim()))
  const run=picked?scientificStudy(picked.number,value):null
  return <>
    <header className="page-header"><div><div className="eyebrow">{machine.name} {machine.code} / SCIENTIFIC SUBSYSTEMS</div>
      <h1>{picked?.name??'Scientific Subsystem Register'}</h1><p>{picked?.purpose??'Physical test stations and controller algorithms with declared interfaces.'}</p></div></header>
    {picked&&control&&run?<div className="study-layout">
      <section className="panel article-panel">
        <h2>Operating parameters</h2>
        <dl><dt>Part designation</dt><dd>ME-0{picked.number}</dd><dt>Implementation</dt><dd>{picked.kind}</dd>
          <dt>Governing relation</dt><dd>{picked.equation}</dd><dt>Quantities and units</dt><dd>{picked.variables}</dd>
          <dt>Interface</dt><dd>{picked.interface}</dd><dt>Failure mode</dt><dd>{picked.failure}</dd></dl>
        <label className="science-control">{control.label} · {value} {control.unit}
          <input aria-label={control.label} type="range" min={control.min} max={control.max} step={control.step} value={value}
            onChange={event=>setValue(Number(event.target.value))}/></label>
        <div className="document-tabs"><a href={machine.href(`component/ME-0${picked.number}`)}>Engineering record</a><a href={machine.href('systems')}>Subsystem register</a></div>
      </section>
      <div className="study-results"><Plot data={run} provenance="simulation"/>
        {!!run.metrics.length&&<section className="panel study-readings"><div className="panel-title"><h2>Calculated values</h2></div>
          <dl>{run.metrics.map(([key,value])=><div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl></section>}
      </div>
    </div>:<>
      <div className="catalog-toolbar"><label className="tree-search"><input type="search" aria-label="Search scientific subsystems" placeholder="Part number, name or domain" value={q} onChange={e=>setQuery(e.target.value)}/></label></div>
      <div className="panel table-scroll"><table><thead><tr><th scope="col">Part</th><th scope="col">Subsystem</th><th scope="col">Implementation</th>
        <th scope="col">Interface</th></tr></thead><tbody>{rows.map(item=><tr key={item.number}>
        <td>ME-0{item.number}</td><td><a href={machine.href(`systems/ME-0${item.number}`)}>{item.name}</a></td>
        <td>{item.kind} · {item.domain}</td><td>{item.interface}</td></tr>)}</tbody></table></div>
    </>}
  </>
}
