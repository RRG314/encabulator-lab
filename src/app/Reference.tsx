import { ArrowLeft, ArrowRight, ArrowUpRight, Box, ClipboardCheck, Download, FileText, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useAssembly, useMachine } from '../machines/context'
import { assetUrl, dimensionText } from '../machines/profiles'
import { functionalGroups } from '../schemas/reference'
import type { Part } from '../schemas/part'
import overview from '../../docs/engineering/overview.md?raw'
import masterSpec from '../../docs/engineering/TE01_MASTER_SPEC.md?raw'
import mechanical from '../../docs/engineering/mechanical.md?raw'
import electrical from '../../docs/engineering/electrical-interface.md?raw'
import thermal from '../../docs/engineering/thermal.md?raw'
import sequence from '../../docs/engineering/assembly-sequence.md?raw'
import safety from '../../docs/engineering/safety.md?raw'
import geometry from '../../docs/engineering/geometry.md?raw'
import validation from '../../docs/engineering/verification-matrix.md?raw'
import revisions from '../../docs/engineering/revisions.md?raw'
import physics from '../../docs/science/models.md?raw'
import meSpec from '../../engineering/me01/MASTER_SPEC.md?raw'
import mePhysics from '../../engineering/me01/OPERATING_MODEL.md?raw'
import meService from '../../engineering/me01/ARCHITECTURE_AND_SERVICE.md?raw'
import meValidation from '../../engineering/me01/VERIFICATION.md?raw'
import reSpec from '../../engineering/re01/MASTER_SPEC.md?raw'
import reHierarchy from '../../engineering/re01/ASSEMBLY_HIERARCHY.md?raw'
import reDesign from '../../engineering/re01/DESIGN_DECISIONS.md?raw'
import reValidation from '../../engineering/re01/VALIDATION_MATRIX.md?raw'
import reStatus from '../../engineering/re01/IMPLEMENTATION_STATUS.md?raw'
import reService from '../../engineering/re01/SERVICE_AND_CONTROLS.md?raw'
import reSources from '../../engineering/re01/SOURCE_TRACEABILITY.md?raw'
import references from '../../engineering/REFERENCES.md?raw'
import interchangeability from '../../engineering/INTERCHANGEABILITY.md?raw'
import sourceTrace from '../../data/re01/source-traceability.json'
import { sourceById } from "../machines/archive"
import { baseline, screening } from '../simulation/calculations'

const teBom = new URL('../../docs/engineering/bom.csv',import.meta.url).href

const teReports = [
  ['FreeCAD assembly','te01-assembled.FCStd','Schematic engineering assembly with an editable body hierarchy.'],
  ['FreeCAD exploded assembly','te01-exploded.FCStd','Exploded transform endpoints and assembly sequence metadata.'],
  ['STEP assembly','te01-assembled.step','Neutral solid geometry at the assembled datum.'],
  ['STEP exploded assembly','te01-exploded.step','Neutral solid geometry at full separation.'],
  ['STEP longitudinal section','te01-section-y.step','Cut at the shaft center plane along Y = 0.'],
  ['STEP transverse section','te01-section-x.step','Cut across the shaft at X = 0.'],
  ['DGS torsional study · STEP','te01-dgs-travel-study.step','Separate travel-limited design study with unassigned torque and stiffness ratings.'],
  ['DGS travel calculation · JSON','dgs-travel-study.json','Reference geometric travel between the hub pin and stops.'],
  ['Part solids · STEP and STL','te01-part-solids.zip','Individual component references in local coordinates.'],
  ['Assembly GLB','te01.glb','Tessellated solid model in Y-up glTF coordinates and metres.'],
  ['Drawing review set · PDF','te01-drawings.pdf','Orthographic and isometric views with schematic dimensions and revision marking.'],
  ['Drawing review set · SVG','te01-drawings-svg.zip','Editable vector drawings for component and assembly review.'],
  ['Geometric verification · JSON','validation.json','B-rep checks, observed dimensions and assembly contacts.'],
  ['Numerical verification · JSON','numerical-validation.json','Analytical comparisons and numerical residuals.'],
]
const specification = masterSpec.split('## 9. Interactive 3D encyclopedia')[0]
const teDocuments = [
  ['overview','System overview',overview],['specification','Specification',specification],['mechanical','Mechanical',mechanical],
  ['electrical','Electrical',electrical],['thermal','Thermal',thermal],['service','Assembly & service',sequence],
  ['safety','Safety',safety],['geometry','Geometry',geometry],['physics','Model equations',physics],['references','References',references],
  ['validation','Verification',validation],['revisions','Revisions',revisions],['calculations','Calculations',''],['downloads','Downloads',''],
]

const reDocuments = [
  ['overview','Technical manual',reSpec],['specification','Master specification',reSpec],['hierarchy','Assembly hierarchy',reHierarchy],
  ['mechanical','Mechanical design',reDesign],['electrical','Electrical & control',reService],['thermal','Thermal & flow',reDesign],
  ['service','Service & calibration',reService],['safety','Safety',safety],['geometry','Geometry & manufacturing',reDesign],
  ['physics','Model equations',reDesign],['references','References',references],['traceability','Source traceability',reSources],
  ['interchangeability','Interchangeability',interchangeability],['validation','Verification',reValidation],['revisions','Revisions',reStatus],
  ['calculations','Calculations',''],['downloads','Downloads',''],
]
const reReports = [
  ['FreeCAD assembled model','re01-assembled.FCStd','Independent Retro Encabulator assembly hierarchy.'],
  ['FreeCAD separated model','re01-exploded.FCStd','Dimension-aware separated transforms.'],
  ['STEP assembly','re01-assembled.step','Assembled neutral solids.'],
  ['STEP separated model','re01-exploded.step','Separated neutral solids.'],
  ['STEP longitudinal section','re01-longitudinal.step','Longitudinal CAD section.'],
  ['STEP transverse section','re01-transverse.step','Transverse CAD section.'],
  ['Part STEP/STL package','part-solids.zip','Standalone local solids for each part identifier.'],
  ['CAD assembly GLB','re01.glb','Browser-compatible mesh with persistent instance identifiers.'],
  ['Drawing set · 66 SVG sheets','drawings.zip','49 component sheets, 15 subsystem sheets and two overall configurations.'],
  ['Technical drawing set · PDF','re01-drawings.pdf','Paginated technical review sheets.'],
  ['Master assembly drawing','drawings/RE01-ASSEMBLY.svg','Assembled orthographic and isometric views.'],
  ['Separated assembly drawing','drawings/RE01-EXPLODED.svg','Separated orthographic and isometric views.'],
  ['OpenCascade verification','validation.json','Measured CAD geometry and review dispositions.'],
  ['Numerical verification','numerical-validation.json','Reference cases for the water loop, linkage and controller.'],
]

const meDocuments = [
  ['overview','Technical manual',meSpec],['mechanical','Mechanical design',meService],['electrical','Electrical & control',meService],
  ['physics','Model equations',mePhysics],['thermal','Thermal & fluid',mePhysics],['service','Service & commissioning',meService],
  ['geometry','Geometry & verification',meValidation],['references','References',references],
  ['validation','Verification',meValidation],['calculations','Calculations',''],['downloads','Downloads',''],
]
const meReports = [
  ['Native assembled CAD','me01-assembled.FCStd','FreeCAD document with physical subsystem and part identifiers.'],
  ['Native separated CAD','me01-exploded.FCStd','FreeCAD document at the separated state.'],
  ['Assembled STEP','me01-assembled.step','Neutral OpenCascade B-reps and part names.'],
  ['Separated STEP','me01-exploded.step','Independent part instance placements.'],
  ['Longitudinal cutaway STEP','me01-longitudinal.step','Neutral section on the lateral datum.'],
  ['Transverse cutaway STEP','me01-transverse.step','Cross-axis section solid reference.'],
  ['Individual STEP/STL','solids.zip','Individual physical parts in local coordinates.'],
  ['Assembly GLB','me01.glb','CAD-derived assembly mesh.'],
  ['Technical drawing set · SVG','drawings.zip','Part and assembly review sheets.'],
  ['Technical drawing set · PDF','me01-drawings.pdf','Paginated technical review sheets.'],
  ['Dimensioned assembly','drawings/ME01-ASSEMBLY.svg','Orthographic and isometric assembly sheet.'],
  ['Separated assembly drawing','drawings/ME01-EXPLODED.svg','Orthographic and isometric separated sheet.'],
  ['Geometry validation','validation.json','OpenCascade checks and contact findings.'],
  ['Numerical validation','numerical-validation.json','Physics, controller and verification results.'],
]

function PageHeader({ type,title,description }: { type:string,title:string,description?:string }) {
  const machine=useAssembly()
  return <header className="page-header"><div><div className="eyebrow">{machine.name} {machine.code} / {type}</div><h1>{title}</h1><p>{description}</p></div></header>
}

export function PartRecord({ part,onSelect }: { part:Part,onSelect:(id:string)=>void }) {
  const machine=useAssembly()
  const { assemblyById,partById,linksFor }=machine.registry
  const detail=machine.service[part.id]
  const dimensions=dimensionText(part,detail)
  const links=linksFor(part.id)
  const host=part.kind==='logical'&&machine.key==='me01'?links.find(link=>link.from===part.id)?.to:undefined
  const source=detail?.source ? sourceTrace.terms[detail.source as keyof typeof sourceTrace.terms] : undefined
  const archivalSource=detail?.originSource ? sourceById.get(detail.originSource) : undefined
  return <>
    <PageHeader type={`COMPONENT RECORD / ${part.id}`} title={part.name} description={part.description} />
    <div className="document-tabs"><a href={machine.href('bom')}><ArrowLeft size={14} /> Component register</a>
      <a href={machine.href('explorer')} onClick={() => onSelect(host??part.id)}><Box size={14} /> {host?'Locate controller':'Locate in assembly'}</a>
      {machine.key==='me01'&&Number(part.id.slice(3))>=40&&<a href={machine.href(`systems/${part.id}`)}>Run subsystem study</a>}
    </div>
    <article className="reference-grid">
      <section className="panel article-panel">
        <h2>Design definition</h2>
        <p>{part.function}</p>
        <dl>
          <dt>Assembly</dt><dd>{assemblyById.get(part.assemblyId)?.name}</dd>
          <dt>Original BOM grouping</dt><dd>{part.sourceAssembly}</dd>
          <dt>Configuration</dt><dd>{part.quantity} · {part.kind} · revision {part.revision}</dd>
          <dt>Candidate specification</dt><dd>{part.proposedSpecification}</dd>
          <dt>Material</dt><dd>{part.material ?? 'Selection pending'}</dd>
          <dt>Nominal dimensions</dt><dd>{dimensions}</dd>
          <dt>Mass</dt><dd>{part.massKg===null?'Pending selection':`${part.massKg} kg · calculated per unit`}</dd>
          <dt>Tolerances</dt><dd>Pending release</dd>
          <dt>Candidate service tool</dt><dd>{detail?.tool ?? 'Selection pending'}</dd>
          {detail?.centerMm&&<><dt>Calculated local centroid</dt><dd>{detail.centerMm.join(' / ')} mm (X/Y/Z)</dd></>}
          {detail?.centroidAxisInertiaKgM2&&<><dt>Centroid-axis inertia</dt><dd>{detail.centroidAxisInertiaKgM2.map(x=>x.toExponential(3)).join(' / ')} kg·m²</dd></>}
          <dt>Mounting</dt><dd>{part.mounting}</dd>
          <dt>Sourcing</dt><dd>{part.sourcing}</dd>
        </dl>
      </section>
      <section className="panel article-panel">
        <h2>Engineering and service</h2>
        <dl>
          <dt>Evidence basis</dt><dd>{part.evidence} · {part.readiness}</dd>
          <dt>Verification</dt><dd>{part.verification}. Physical evidence pending.</dd>
          <dt>Operating constraints</dt><dd>{part.limits}</dd>
          <dt>Failure modes</dt><dd>{detail?.failureMode}</dd>
          <dt>Inspection and maintenance</dt><dd>{part.maintenance}</dd>
          <dt>Installation and removal</dt><dd><a href={machine.href('engineering/service')}>Assembly and service sequence</a>. Released procedure pending.</dd>
          <dt>CAD reference</dt><dd>{part.kind === 'logical' ? 'Controller computation' : <a href={assetUrl(part.cadAssetPath ?? 'models/te01-part-solids.zip')} download>{part.id} · CAD download</a>}</dd>
          <dt>Revision history</dt><dd><a href={machine.href('engineering/revisions')}>{part.revision} · Revision record</a></dd>
          {machine.key!=='te01' && part.kind!=='logical' && <><dt>Technical drawing</dt><dd><a href={assetUrl(part.diagramRefs[0])} download>Dimensioned schematic SVG</a></dd></>}
          {archivalSource && <><dt>Reconstruction evidence</dt><dd><a href={archivalSource.url}>{archivalSource.id} · {archivalSource.title}</a>. {archivalSource.relevance}</dd></>}
          {source && <><dt>Terminology source</dt><dd><a href={sourceTrace.url}>Rockwell transcript, p. {sourceTrace.page}, ¶{source.paragraph}</a></dd></>}
        </dl>
        {part.equations.length > 0 && <><h3>Governing relations</h3><ul className="equation-list">{part.equations.map(eq => <li key={eq}>{eq}</li>)}</ul><a href={machine.href('simulation')}>Related simulations</a></>}
      </section>
      <section className="panel article-panel full-reference">
        <h2>Interface register</h2>
        <div className="table-scroll"><table><thead><tr><th scope="col">Type</th><th scope="col">Related part</th><th scope="col">Interface</th></tr></thead>
          <tbody>{links.map(link => { const id=link.to===part.id ? link.from : link.to; return <tr key={link.id}>
            <td>{link.kind}</td><td><a href={machine.href(`component/${id}`)}>{id} · {partById.get(id)?.name}</a></td><td>{link.label}</td></tr> })}</tbody>
        </table></div>
        {part.safetyFlags.length > 0 && <p><a href={machine.href('engineering/safety')}>Safety classification</a> · {part.safetyFlags.join(' · ')}</p>}
      </section>
    </article>
  </>
}

export function Catalog() {
  const machine=useAssembly()
  const {parts,assemblies}=machine.registry
  const bomUrl=machine.key==='te01'?teBom:assetUrl(`${machine.assetFolder}/bom.csv`)
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState('')
  const rows = parts.filter(part => (!group || part.assemblyId === group) &&
    `${part.id} ${part.name} ${part.proposedSpecification}`.toLowerCase().includes(query.trim().toLowerCase()))
  return <>
    <PageHeader type="CANONICAL REGISTRY" title="Component Register" description="Preliminary bill of materials and engineering records." />
    <div className="catalog-toolbar">
      <label className="tree-search"><Search size={15} /><input type="search" aria-label="Search parts catalog" placeholder="Part ID, name or specification"
        value={query} onChange={event => setQuery(event.target.value)} /></label>
      <label>Assembly <select value={group} onChange={event => setGroup(event.target.value)}><option value="">All assemblies</option>
        {assemblies.map(a => <option key={a.id} value={a.id}>{a.shortName}</option>)}</select></label>
      <a className="secondary-button" href={bomUrl} download={`${machine.code}-BOM.csv`}><Download size={14} /> Download BOM</a>
    </div>
    <div className="panel table-scroll"><table className="catalog-table"><thead><tr>
      <th scope="col">Part ID</th><th scope="col">Component</th><th scope="col">Qty</th><th scope="col">Assembly</th>
      <th scope="col">Candidate specification</th><th scope="col">Verification</th></tr></thead>
      <tbody>{rows.map(part => <tr key={part.id}><td className="mono">{part.id}</td>
        <td><a href={machine.href(`component/${part.id}`)}>{part.name} <ArrowUpRight size={12} /></a></td>
        <td>{part.quantity}</td><td>{part.assemblyId}</td><td>{part.proposedSpecification}</td><td>{part.verification}</td></tr>)}
      </tbody></table>{rows.length===0 && <p className="empty-tree">No component matches this search.</p>}</div>
  </>
}

function FunctionalRegister() {
  const machine=useMachine()
  const {assemblies,assemblyById,partById}=machine.registry
  const groups=machine.key==='te01'?functionalGroups:assemblies.map(a=>({id:a.id,name:a.name,assemblies:[a.id],interfaces:[]}))

  return <div className="reference-grid functional-list">
    {groups.map(group => <section className="panel article-panel" key={group.id}>
      <div className="eyebrow">{group.id}</div><h3>{group.name}</h3>
      <p>{group.assemblies.map(id=>assemblyById.get(id)?.name).join(' · ')}</p>
      <div className="ref-links">{[...new Set([...group.assemblies.flatMap(id=>assemblyById.get(id)?.partIds ?? []),...group.interfaces])].map(id=>
        <a key={id} href={machine.href(`component/${id}`)} title={partById.get(id)?.name}>{id}</a>)}</div>
    </section>)}
  </div>
}

function DownloadPage() {
  const machine=useMachine()
  const bomUrl=machine.key==='te01'?teBom:assetUrl(`${machine.assetFolder}/bom.csv`)
  const reports=machine.key==='te01'?teReports:machine.key==='re01'?reReports:meReports

  return <div className="download-list">
    <a className="panel download-row" href={bomUrl} download={`${machine.code}-BOM.csv`}><FileText size={19} /><div><b>Preliminary BOM · CSV</b><p>Canonical parts, quantities, candidate specifications and validation obligations.</p></div><Download size={17} /></a>
    {reports.map(([name,file,description]) => <a className="panel download-row" key={file} href={assetUrl(`${machine.assetFolder}/${file}`)} download>
      <FileText size={19} /><div><b>{name}</b><p>{description}</p></div><Download size={17} /></a>)}
  </div>
}

interface ReportData {
  geometry: { checks: { check:string, expected:unknown, observed:unknown, status:string, unit:string | null }[] }
  numerical: { readings: { condition:string, expected:number, observed:number, absoluteError:number, tolerance:number, status:string }[] }
}

function ValidationResults() {
  const {assetFolder}=useMachine()
  const [data,setData] = useState<ReportData | null>(null)
  const [error,setError] = useState(false)
  useEffect(() => {
    const controller = new AbortController()
    const load = async (name:string) => {
      const response = await fetch(assetUrl(`${assetFolder}/${name}`),{signal:controller.signal})
      if (!response.ok) throw new Error('Verification report unavailable')
      return response.json()
    }
    void Promise.all([load('validation.json'),load('numerical-validation.json')])
      .then(([geometry,numerical]) => setData({geometry,numerical}))
      .catch(() => { if (!controller.signal.aborted) setError(true) })
    return () => controller.abort()
  }, [assetFolder])
  if (error) return <p role="status">Verification reports are unavailable.</p>
  if (!data) return <p role="status">Loading verification results…</p>
  const observation = (value:unknown):string =>
    Array.isArray(value) && value.some(item => typeof item === 'object')
      ? `${value.length} entries in the report` : typeof value === 'string' ? value : JSON.stringify(value)
  return <div className="doc-report">
    <h3>OpenCascade geometry results</h3>
    <div className="table-scroll"><table>
      <thead><tr><th scope="col">Check</th><th scope="col">Expected</th><th scope="col">Observed</th><th scope="col">Status</th></tr></thead>
      <tbody>{data.geometry.checks.map(row => <tr key={row.check}><td>{row.check}</td><td>{observation(row.expected)}</td>
        <td>{observation(row.observed)}{row.unit && typeof row.observed==='number' ? ` ${row.unit}` : ''}</td><td>{row.status}</td></tr>)}</tbody>
    </table></div>
    <h3>Numerical reference cases</h3>
    <div className="table-scroll"><table>
      <thead><tr><th scope="col">Condition</th><th scope="col">Expected</th><th scope="col">Observed</th><th scope="col">Absolute error</th>
        <th scope="col">Tolerance</th><th scope="col">Status</th></tr></thead>
      <tbody>{data.numerical.readings.map(row => <tr key={row.condition}><td>{row.condition}</td>
        {[row.expected,row.observed,row.absoluteError,row.tolerance].map((value,i) => <td key={i} className="mono">{Number(value.toPrecision(5))}</td>)}
        <td>{row.status}</td></tr>)}</tbody>
    </table></div>
  </div>
}

function Calculations() {
  const machine=useMachine()
  const assumption=useMemo(()=>machine.key==='me01'?{...baseline,diameterM:.013,spanM:.263,fromLeftM:.1315,forceN:63,torqueNm:.47,rotorMassKg:.64,rotorRadiusM:.070,bearingRatingN:1800,bearingLoadN:78,rpm:1450}:machine.key==='re01'?{...baseline,diameterM:.012,spanM:.164,fromLeftM:.082,forceN:44,
    torqueNm:.34,rotorMassKg:.34,rotorRadiusM:.063,bearingRatingN:1500,bearingLoadN:50,rpm:1550}:baseline,[machine.key])
  const [force,setForce] = useState(assumption.forceN)
  const [rpm,setRpm] = useState(assumption.rpm)
  const output = useMemo(()=>screening({...assumption,forceN:force,rpm}),[assumption,force,rpm])
  const rows: [string,number,string,string][] = [
    ['Bearing reactions',output.left,'N (left)','Rₐ = Fb/L'],
    ['Bearing reactions',output.right,'N (right)','Rᵦ = Fa/L'],
    ['Nominal bending stress',output.bending/1e6,'MPa','σ = 32M/(πd³)'],
    ['Nominal torsional shear',output.shear/1e6,'MPa','τ = 16T/(πd³)'],
    ['Nominal combined stress',output.vonMises/1e6,'MPa','σeq = √(σ² + 3τ²)'],
    ['Load-point deflection',output.deflection*1e6,'µm','δ = Fa²b²/(3EIL)'],
    ['Shaft-only critical speed',output.criticalRpm,'rpm','Ωₙ = √(48EI/(L³m))'],
    ['Disk inertia approximation',output.polarInertia,'kg·m²','J = mr²/2'],
    ['Equivalent shaft stiffness',output.couplingK,'N·m/rad','k = Gπd⁴/(32L)'],
    ['Two-inertia shaft mode',output.shaftModeHz,'Hz','fₙ = √(k(1/J₁ + 1/J₂))/(2π)'],
    ['Basic bearing life',output.lifeMillionsRev,'million rev','L₁₀ = (C/P)³'],
    ['Constant-speed conversion',output.lifeHours,'h','L₁₀h = L₁₀ × 10⁶/(60n)'],
    ['Radial unbalance amplitude',output.unbalanceForce,'N','Fᵤ = meΩ²'],
    ['Equal-share bolt shear',output.equalBoltShear/1e6,'MPa','τ = F/(nA)'],
    ['Thermal growth',output.expansion*1000,'mm','ΔL = αLΔT'],
    ['Initial motor torque screen',output.motorTorque,'N·m','τ = (J₁ + J₂)Ω̇ + τload'],
  ]
  return <article className="panel article-panel doc-prose">
    <h2>Shaft and support screening</h2><p>Illustrative assumptions and closed-form results. The model represents a round, simply supported shaft with a centered load. The calculation excludes fatigue, stress concentration, support compliance and material design allowables.</p>
    <div className="calc-inputs"><label>Transverse load · {force} N<input type="range" min="1" max="100" value={force} onChange={e=>setForce(Number(e.target.value))} /></label>
      <label>Constant speed · {rpm} rpm<input type="range" min="300" max={machine.speed[1]} step="25" value={rpm} onChange={e=>setRpm(Number(e.target.value))} /></label></div>
    <p>Assumed basis · {assumption.diameterM*1000} mm shaft, {assumption.spanM*1000} mm span, 200 GPa elastic modulus, 77 GPa shear modulus, {assumption.rotorMassKg} kg rotor, {assumption.bearingRatingN} N bearing rating and {assumption.bearingLoadN} N equivalent bearing load.</p>
    <div className="table-scroll"><table><thead><tr><th scope="col">Screen</th><th scope="col">Governing relation</th><th scope="col">Calculated value</th></tr></thead>
      <tbody>{rows.map(([name,value,unit,eq])=><tr key={eq}><td>{name}</td><td className="mono">{eq}</td><td>{Number(value.toPrecision(4))} {unit}</td></tr>)}</tbody>
    </table></div>
  </article>
}

export default function Reference({ section }: { section?: string }) {
  const machine=useMachine()
  const documents=machine.key==='te01'?teDocuments:machine.key==='re01'?reDocuments:meDocuments
  const doc = documents.find(item => item[0] === section) ?? documents[0]
  const [slug, title, content] = doc
  return <>
    <PageHeader type="ENGINEERING REFERENCE" title={title} description="Design basis, interfaces, drawings and verification evidence." />
    <nav className="document-tabs" aria-label="Engineering documents">{documents.map(([key,label])=>
      <a key={key} href={machine.href(`engineering/${key}`)} aria-current={slug===key?'page':undefined}>{label}</a>)}</nav>
    {slug === 'downloads' ? <DownloadPage /> : slug === 'calculations' ? <Calculations /> :
      <article className="panel article-panel doc-prose">
        <Markdown remarkPlugins={[remarkGfm]} components={{h1:props=><h2>{props.children}</h2>,
          table:props=><div className="table-scroll"><table>{props.children}</table></div>}}>{content}</Markdown>
        {slug === 'validation' && <><ValidationResults /><div className="document-tabs"><a href={assetUrl(`${machine.assetFolder}/validation.json`)} download><ClipboardCheck size={14} /> Geometry results</a>
          <a href={assetUrl(`${machine.assetFolder}/numerical-validation.json`)} download><ClipboardCheck size={14} /> Numerical results</a></div></>}
        {slug === 'overview' && <div className="document-tabs"><a href={machine.href('explorer')}><Box size={14} /> Open model <ArrowRight size={14} /></a>
          <a href={machine.href('diagnostics')}>Diagnostic replay <ArrowRight size={14} /></a></div>}
      </article>}
    {slug === 'overview' && machine.key==='me01' && <div className="document-tabs"><a href={machine.href('systems')}>Scientific Subsystem Register</a></div>}
    {slug === 'overview' && <FunctionalRegister />}
  </>
}
