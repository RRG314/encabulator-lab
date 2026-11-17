import { useMemo, useState } from 'react'
import { Archive as ArchiveIcon, ArrowUpRight, FileText, Search } from 'lucide-react'
import { archive, archiveById, archiveCad, archiveHref, archiveProfile, contributeConfigurationUrl, downloadUrl, sourceById, sources, workbenchHref } from '../machines/archive'
import type { ArchiveCad, ArchiveEntry } from '../machines/archive'
import { assetUrl, isMachineKey, machineRoute } from '../machines/profiles'
import { AssemblyContext } from '../machines/context'
import { AssemblyWorkbench } from './Explorer'
import { Catalog, PartRecord } from './Reference'
import ArchiveBench from './ArchiveBench'
import { SourceEvidence } from '../components/SourceEvidence'
import type { ArchiveFrame } from '../simulation/archive'

function archivedSignals(kind:ArchiveEntry['study'],frame:ArchiveFrame):Record<string,number>|undefined {
  if(kind==='charge')return {'MI-005':frame.values[1]/24,'MI-006':frame.values[1]/24,'MI-009':frame.values[0]/24,'MI-010':frame.values[0]/24}
  if(kind==='resonators')return {'ET-004':frame.values[0]/20,'ET-007':frame.values[0]/20,'ET-008':frame.values[0]/20}
  return undefined
}

function ArchiveIndex(){
  const [query,setQuery]=useState('')
  const [family,setFamily]=useState('')
  const [kind,setKind]=useState('')
  const [period,setPeriod]=useState('')
  const terms=query.trim().toLowerCase().split(/\s+/)
  const records=archive.filter(entry=>{
    if((family&&entry.family!==family)||(kind&&entry.kind!==kind)||(period&&entry.period!==period))return false
    const text=[entry.name,entry.code,entry.origin,entry.configuration,...entry.aliases,...entry.components.flat()].join(' ').toLowerCase()
    return terms.every(term=>text.includes(term))
  })
  return <>
    <header className="page-header"><div><div className="eyebrow">CONFIGURATION CONTROL / HISTORICAL REGISTRY</div>
      <h1>Encabulator Technical Archive</h1><p>Original references, model drawings, built configurations and operating studies.</p></div>
      <a className="primary-button" href={contributeConfigurationUrl}>Contribute a configuration <ArrowUpRight size={15}/></a>
    </header>
    <section className="panel archive-index" aria-label="Historical configuration index">
      <div className="archive-filters">
        <label><Search size={16}/> Search archive<input type="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Machine, organization, or component"/></label>
        <Filter label="Family" value={family} options={archive.map(record=>record.family).sort()} change={setFamily}/>
        <Filter label="Record class" value={kind} options={archive.map(record=>record.kind).sort()} change={setKind}/>
        <Filter label="Publication period" value={period} options={archive.map(record=>record.period)} change={setPeriod}/>
      </div>
      <div className="panel-title"><ArchiveIcon size={17}/><h2>Configuration register</h2><a href={archiveHref('sources')}>Source register</a></div>
      <div className="table-scroll"><table><thead><tr><th scope="col">Designation</th><th scope="col">Configuration</th><th scope="col">Period</th><th scope="col">Record class</th></tr></thead>
        <tbody>{records.map(record=><tr key={record.id}>
          <th scope="row">{record.code}</th><td><a href={archiveHref(record.id)}>{record.name} <ArrowUpRight size={13}/></a><small>{record.origin}</small></td><td>{record.period}</td><td>{record.kind}</td>
        </tr>)}</tbody>
      </table></div>
      {!records.length&&<p role="status" className="archive-empty">No configuration matches the selected filters.</p>}
    </section>
  </>
}

function Filter({label,value,options,change}:{label:string;value:string;options:string[];change:(value:string)=>void}){
  return <label>{label}<select value={value} onChange={event=>change(event.target.value)}>
    <option value="">All</option>{[...new Set(options)].map(option=><option key={option}>{option}</option>)}</select></label>
}

function Sources({ids}:{ids?:string[]}){
  const rows=ids?ids.map(id=>sourceById.get(id)!):sources
  return <section className="panel article-panel doc-prose">
    <h2>Source register</h2>
    <div className="table-scroll"><table><thead><tr><th scope="col">ID</th><th scope="col">Publication</th><th scope="col">Evidence reviewed</th></tr></thead>
      <tbody>{rows.map(source=><tr key={source.id}>
        <th scope="row">{source.id}</th><td><a href={source.url}>{source.title}</a><small>{source.author} · {source.date??'Undated'} · {source.type}</small></td>
        <td>{source.relevance}<small>Reviewed {source.reviewedOn}</small></td>
      </tr>)}</tbody>
    </table></div>
  </section>
}

function Publications({entry,model,service=false}:{entry:ArchiveEntry;model:ArchiveCad;service?:boolean}){
  return <div className="reference-grid">
    <section className="panel article-panel doc-prose">
      <h2>{service?'Assembly and service':'Drawing register and revisions'}</h2>
      {service?<ol>
        <li>Isolate the instrumentation source and restrain any rotating train. Discharge stored electrical energy before access.</li>
        {model.guard.length>0&&<li>Extract the removable covers before interior service.</li>}
        <li>Follow the staged separation from the outer interfaces toward the support datum.</li>
        <li>Inspect alignment, retention and connector interfaces against their component drawings. Reassemble in reverse order.</li>
      </ol>:<p>Revision {model.revision} establishes the nominal reconstruction. Individual part drawings are available in the component register.</p>}
      <p>{entry.gap}</p>
      <div className="archive-actions">{model.assets.filter(item=>/drawing$/.test(item.name)).map(item=><a className="secondary-button" key={item.path} href={downloadUrl(item)} download><FileText size={15}/>{item.name}</a>)}</div>
    </section>
    <section className="panel article-panel archive-drawing">
      <h2>Assembled reference</h2>
      <img src={assetUrl(model.assetFolder+'/drawings/assembled.svg')} alt={entry.code+' orthographic assembly drawing'} loading="lazy"/>
    </section>
  </div>
}

function RecordSummary({record,model}:{record:ArchiveEntry;model?:ArchiveCad}){
  return <>
    <div className="reference-grid">
      <section className="panel article-panel doc-prose">
        <h2>Configuration definition</h2>
        <p>{record.configuration}</p>
        <dl><dt>Origin</dt><dd>{record.origin}</dd><dt>Publication period</dt><dd>{record.period}</dd>
          <dt>Operating description</dt><dd>{record.operation}</dd><dt>Evidence limits</dt><dd>{record.gap}</dd>
          {record.aliases.length>0&&<><dt>Search aliases</dt><dd>{record.aliases.join(' · ')}</dd></>}
        </dl>
        {record.related.length>0&&<><h3>Related configurations</h3><ul>{record.related.map(id=><li key={id}><a href={archiveHref(id)}>{archiveById.get(id)?.name}</a></li>)}</ul></>}
      </section>
      {model&&<section className="panel article-panel doc-prose"><h2>Data and CAD publications</h2>
        <ul className="archive-downloads">{model.assets.map(file=><li key={file.path}><a href={downloadUrl(file)} download>{file.name}</a></li>)}</ul>
      </section>}
      {!model&&<SourceEvidence key={record.id} id={record.id}/>}
      {record.id==='ge-1962'&&model&&<section className="panel article-panel full-reference doc-prose">
        <h2>Nominal dimensions and evidence</h2>
        <p>HBK-8359 supplies an unscaled perspective photograph. Page 802 lists dimension drawings and external wiring as furnished on delivery. Historical millimetre dimensions remain unverified.</p>
        <dl>
          <dt>Assembled CAD envelope (X × Y × Z)</dt><dd>{model.boundsMm.map(value=>value.toFixed(2)).join(' × ')} mm</dd>
          <dt>Baseplate footprint (X × Y)</dt><dd>{model.baseMm?.map(value=>value.toFixed(2)).join(' × ')} mm</dd>
          <dt>Shaft height above the baseplate</dt><dd>{model.shaftHeight} mm</dd>
        </dl>
      </section>}
      {record.components.length>0&&<section className="panel article-panel full-reference doc-prose"><h2>Source-level component evidence</h2>
        <div className="table-scroll"><table><thead><tr><th scope="col">Source term</th><th scope="col">Evidence</th><th scope="col">Relationship</th></tr></thead>
          <tbody>{record.components.map(([term,source,description])=><tr key={term}><th scope="row">{term}</th>
            <td><a href={sourceById.get(source)?.url}>{source}</a></td><td>{description}</td></tr>)}</tbody></table></div>
      </section>}
    </div>
    {record.sourceIds.length>0&&<Sources ids={record.sourceIds}/>}
  </>
}

function ArchiveRecord({record,view,detail}:{record:ArchiveEntry;view?:string;detail?:string}){
  const model=archiveCad[record.id]
  const profile=useMemo(()=>model?archiveProfile(record,model):undefined,[record,model])
  const [selected,setSelected]=useState(()=>{
    try{return sessionStorage.getItem(record.id+'.part')??model?.defaultPart??''}catch{return model?.defaultPart??''}
  })
  const select=(value:string)=>{setSelected(value);try{sessionStorage.setItem(record.id+'.part',value)}catch{/* Selection remains available for this visit. */}}
  const part=detail?profile?.registry.partById.get(detail):undefined
  const assembly=workbenchHref(record)
  const testBench=record.study?archiveHref(record.id,'study'):isMachineKey(record.id)?machineRoute(record.id,'simulation'):undefined
  const links=<nav className="document-tabs" aria-label="Configuration documents">
    <a href={archiveHref()}>Configuration index</a>
    <a href={archiveHref(record.id)} aria-current={!view?'page':undefined}>Technical record</a>
    {record.id==='ge-1962'&&<>
      <a href={sourceById.get('G62A')!.url}>1962 catalog photograph · Figure 1</a>
      <a href="https://github.com/RRG314/turbo-encabulator/blob/main/engineering/GE62_DIMENSION_AUDIT.md">Dimension audit</a>
    </>}
    {assembly&&<a href={assembly} aria-current={view==='assembly'?'page':undefined}>Assembly workbench</a>}
    {testBench&&<a href={testBench} aria-current={view==='study'?'page':undefined}>Operating study</a>}
    {model&&<a href={archiveHref(record.id,'bom')} aria-current={view==='bom'?'page':undefined}>Component register</a>}
    {model&&<a href={archiveHref(record.id,'engineering','service')} aria-current={view==='engineering'?'page':undefined}>Assembly and service</a>}
    {isMachineKey(record.id)&&<a href={machineRoute(record.id,'engineering/downloads')}>CAD publications</a>}
  </nav>
  if(view==='assembly'&&profile)return <AssemblyContext.Provider value={profile}>
    {links}<AssemblyWorkbench selected={selected} onSelect={select} />
  </AssemblyContext.Provider>
  if(view==='component'&&part&&profile)return <AssemblyContext.Provider value={profile}>{links}<PartRecord part={part} onSelect={select}/></AssemblyContext.Provider>
  if(view==='bom'&&profile)return <AssemblyContext.Provider value={profile}>{links}<Catalog/></AssemblyContext.Provider>
  return <>
    <header className="page-header"><div><div className="eyebrow">{record.kind.toUpperCase()} / {record.code}</div>
      <h1>{record.name}</h1><p>{view==='study'?record.operation:record.configuration}</p></div></header>
    {links}
    {view==='study'&&record.study?<div className={profile?undefined:'source-study'}><ArchiveBench key={record.study} kind={record.study} model={profile?(frame,fixture)=>
      <AssemblyContext.Provider value={profile}><AssemblyWorkbench lab selected={selected} onSelect={select}
        controls={()=>fixture}
        telemetry={{speedRpm:frame.rpm,primaryAngleRad:frame.shaftPhaseRad,inputAngleRad:frame.inputAngleRad,signalLevels:archivedSignals(record.study,frame)}}/></AssemblyContext.Provider>:undefined}/>
      {!profile&&<SourceEvidence id={record.id}/>}</div>:
      view==='engineering'&&model?<Publications entry={record} model={model} service={detail==='service'}/>:<RecordSummary record={record} model={model}/>}
  </>
}

export default function Archive({id,view,detail}:{id?:string;view?:string;detail?:string}){
  if(!id)return <ArchiveIndex/>
  if(id==='sources')return <><header className="page-header"><div><div className="eyebrow">TECHNICAL ARCHIVE</div><h1>Historical Sources</h1></div></header>
    <div className="document-tabs"><a href={archiveHref()}>Configuration index</a></div><Sources/></>
  const record=archiveById.get(id)
  return record?<ArchiveRecord key={id} record={record} view={view} detail={detail}/>:<><h1>Configuration unavailable</h1><a href={archiveHref()}>Return to configuration index</a></>
}
