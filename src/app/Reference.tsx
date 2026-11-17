import { ArrowLeft, ArrowRight, ArrowUpRight, Box, ClipboardCheck, Download, FileText, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { assemblies, assemblyById, linksFor, partById, parts } from '../data'
import { functionalGroups, service } from '../schemas/reference'
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
import { baseline, screening } from '../simulation/calculations'

const asset = (name:string) => `${import.meta.env.BASE_URL}models/${name}`
const bomUrl = new URL('../../docs/engineering/bom.csv',import.meta.url).href
const reports = [
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
const documents = [
  ['overview','System overview',overview],['specification','Specification',specification],['mechanical','Mechanical',mechanical],
  ['electrical','Electrical',electrical],['thermal','Thermal',thermal],['service','Assembly & service',sequence],
  ['safety','Safety',safety],['geometry','Geometry',geometry],['physics','Technical references',physics],
  ['validation','Verification',validation],['revisions','Revisions',revisions],['calculations','Calculations',''],['downloads','Downloads',''],
]

function PageHeader({ type,title,description }: { type:string,title:string,description?:string }) {
  return <header className="page-header"><div><div className="eyebrow">TE-01 / {type}</div><h1>{title}</h1><p>{description}</p></div></header>
}

export function PartRecord({ part,onSelect }: { part:Part,onSelect:(id:string)=>void }) {
  const dimensions = part.dimensionsMm ? Object.entries(part.dimensionsMm).map(([key,value]) =>
    `${key.replace(/[A-Z]/g,letter=>` ${letter.toLowerCase()}`)} ${value} mm`).join(' · ') : 'Pending engineering selection'
  const links = linksFor(part.id)
  return <>
    <PageHeader type={`COMPONENT RECORD / ${part.id}`} title={part.name} description={part.description} />
    <div className="document-tabs"><a href="#/bom"><ArrowLeft size={14} /> Parts catalog</a><a href="#/explorer" onClick={() => onSelect(part.id)}><Box size={14} /> Locate in explorer</a></div>
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
          <dt>Mass and tolerances</dt><dd>Pending measurement and release</dd>
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
          <dt>Failure modes</dt><dd>{service[part.id]?.failureMode}</dd>
          <dt>Inspection and maintenance</dt><dd>{part.maintenance}</dd>
          <dt>Installation and removal</dt><dd><a href="#/engineering/service">Assembly and service sequence</a>. Released procedure pending.</dd>
          <dt>CAD reference</dt><dd>{part.kind === 'logical' ? 'Controller reference marker' : <a href={asset('te01-part-solids.zip')} download>{part.id} · STEP and STL archive</a>}</dd>
          <dt>Revision history</dt><dd><a href="#/engineering/revisions">0.1 · Baseline definition</a></dd>
        </dl>
        {part.equations.length > 0 && <><h3>Governing relations</h3><ul className="equation-list">{part.equations.map(eq => <li key={eq}>{eq}</li>)}</ul><a href="#/simulation">Related simulations</a></>}
      </section>
      <section className="panel article-panel full-reference">
        <h2>Interface register</h2>
        <div className="table-scroll"><table><thead><tr><th scope="col">Type</th><th scope="col">Related part</th><th scope="col">Interface</th></tr></thead>
          <tbody>{links.map(link => { const id=link.to===part.id ? link.from : link.to; return <tr key={link.id}>
            <td>{link.kind}</td><td><a href={`#/component/${id}`}>{id} · {partById.get(id)?.name}</a></td><td>{link.label}</td></tr> })}</tbody>
        </table></div>
        {part.safetyFlags.length > 0 && <p><a href="#/engineering/safety">Safety classification</a> · {part.safetyFlags.join(' · ')}</p>}
      </section>
    </article>
  </>
}

export function Catalog() {
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState('')
  const rows = parts.filter(part => (!group || part.assemblyId === group) &&
    `${part.id} ${part.name} ${part.proposedSpecification}`.toLowerCase().includes(query.trim().toLowerCase()))
  return <>
    <PageHeader type="CANONICAL REGISTRY" title="Parts catalog" description="Preliminary bill of materials and engineering records." />
    <div className="catalog-toolbar">
      <label className="tree-search"><Search size={15} /><input type="search" aria-label="Search parts catalog" placeholder="Part ID, name or specification"
        value={query} onChange={event => setQuery(event.target.value)} /></label>
      <label>Assembly <select value={group} onChange={event => setGroup(event.target.value)}><option value="">All assemblies</option>
        {assemblies.map(a => <option key={a.id} value={a.id}>{a.shortName}</option>)}</select></label>
      <a className="secondary-button" href={bomUrl} download="TE01_BOM.csv"><Download size={14} /> Download BOM</a>
    </div>
    <div className="panel table-scroll"><table className="catalog-table"><thead><tr>
      <th scope="col">Part ID</th><th scope="col">Component</th><th scope="col">Qty</th><th scope="col">Assembly</th>
      <th scope="col">Candidate specification</th><th scope="col">Verification</th></tr></thead>
      <tbody>{rows.map(part => <tr key={part.id}><td className="mono">{part.id}</td>
        <td><a href={`#/component/${part.id}`}>{part.name} <ArrowUpRight size={12} /></a></td>
        <td>{part.quantity}</td><td>{part.assemblyId}</td><td>{part.proposedSpecification}</td><td>{part.verification}</td></tr>)}
      </tbody></table>{rows.length===0 && <p className="empty-tree">No component matches this search.</p>}</div>
  </>
}

function FunctionalRegister() {
  return <div className="reference-grid functional-list">
    {functionalGroups.map(group => <section className="panel article-panel" key={group.id}>
      <div className="eyebrow">{group.id}</div><h3>{group.name}</h3>
      <p>{group.assemblies.map(id=>assemblyById.get(id)?.name).join(' · ')}</p>
      <div className="ref-links">{[...new Set([...group.assemblies.flatMap(id=>assemblyById.get(id)?.partIds ?? []),...group.interfaces])].map(id=>
        <a key={id} href={`#/component/${id}`} title={partById.get(id)?.name}>{id}</a>)}</div>
    </section>)}
  </div>
}

function DownloadPage() {
  return <div className="download-list">
    <a className="panel download-row" href={bomUrl} download="TE01_BOM.csv"><FileText size={19} /><div><b>Preliminary BOM · CSV</b><p>Canonical parts, quantities, candidate specifications and validation obligations.</p></div><Download size={17} /></a>
    {reports.map(([name,file,description]) => <a className="panel download-row" key={file} href={asset(file)} download>
      <FileText size={19} /><div><b>{name}</b><p>{description}</p></div><Download size={17} /></a>)}
  </div>
}

interface ReportData {
  geometry: { checks: { check:string, expected:unknown, observed:unknown, status:string, unit:string | null }[] }
  numerical: { readings: { condition:string, expected:number, observed:number, absoluteError:number, tolerance:number, status:string }[] }
}

function ValidationResults() {
  const [data,setData] = useState<ReportData | null>(null)
  const [error,setError] = useState(false)
  useEffect(() => {
    const controller = new AbortController()
    const load = async (name:string) => {
      const response = await fetch(asset(name),{signal:controller.signal})
      if (!response.ok) throw new Error('Verification report unavailable')
      return response.json()
    }
    void Promise.all([load('validation.json'),load('numerical-validation.json')])
      .then(([geometry,numerical]) => setData({geometry,numerical}))
      .catch(() => { if (!controller.signal.aborted) setError(true) })
    return () => controller.abort()
  }, [])
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
  const [force,setForce] = useState(baseline.forceN)
  const [rpm,setRpm] = useState(baseline.rpm)
  const output = useMemo(()=>screening({...baseline,forceN:force,rpm}),[force,rpm])
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
      <label>Constant speed · {rpm} rpm<input type="range" min="300" max="3000" step="25" value={rpm} onChange={e=>setRpm(Number(e.target.value))} /></label></div>
    <p>Assumed basis · 8 mm shaft, 96 mm span, 200 GPa elastic modulus, 77 GPa shear modulus, 0.16 kg rotor, 1,000 N bearing rating and 35 N equivalent bearing load.</p>
    <div className="table-scroll"><table><thead><tr><th scope="col">Screen</th><th scope="col">Governing relation</th><th scope="col">Calculated value</th></tr></thead>
      <tbody>{rows.map(([name,value,unit,eq])=><tr key={eq}><td>{name}</td><td className="mono">{eq}</td><td>{Number(value.toPrecision(4))} {unit}</td></tr>)}</tbody>
    </table></div>
  </article>
}

export default function Reference({ section }: { section?: string }) {
  const doc = documents.find(item => item[0] === section) ?? documents[0]
  const [slug, title, content] = doc
  return <>
    <PageHeader type="ENGINEERING REFERENCE" title={title} description="Design basis, interfaces, drawings and verification evidence." />
    <nav className="document-tabs" aria-label="Engineering documents">{documents.map(([key,label])=>
      <a key={key} href={`#/engineering/${key}`} aria-current={slug===key?'page':undefined}>{label}</a>)}</nav>
    {slug === 'downloads' ? <DownloadPage /> : slug === 'calculations' ? <Calculations /> :
      <article className="panel article-panel doc-prose">
        <Markdown remarkPlugins={[remarkGfm]} components={{h1:props=><h2>{props.children}</h2>,
          table:props=><div className="table-scroll"><table>{props.children}</table></div>}}>{content}</Markdown>
        {slug === 'validation' && <><ValidationResults /><div className="document-tabs"><a href={asset('validation.json')} download><ClipboardCheck size={14} /> Geometry results</a>
          <a href={asset('numerical-validation.json')} download><ClipboardCheck size={14} /> Numerical results</a></div></>}
        {slug === 'overview' && <div className="document-tabs"><a href="#/explorer"><Box size={14} /> Open model <ArrowRight size={14} /></a>
          <a href="#/diagnostics">Diagnostic replay <ArrowRight size={14} /></a></div>}
      </article>}
    {slug === 'overview' && <FunctionalRegister />}
  </>
}
