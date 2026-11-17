import { Archive as ArchiveIcon, BookOpen, Box, ClipboardList, FlaskConical, GitCompareArrows } from 'lucide-react'
import { lazy, Suspense, useEffect, useState } from 'react'
import { MachineContext } from '../machines/context'
import { archive, archiveById, archiveCad, archiveHref, workbenchHref } from '../machines/archive'
import { isMachineKey, machineRoute, machines, readRoute } from '../machines/profiles'
import type { MachineKey } from '../machines/profiles'
import { Explorer } from './Explorer'
import { LabWordmark } from '../components/LabWordmark'

const Home = lazy(() => import('./Home'))
const Reference = lazy(() => import('./Reference'))
const Catalog = lazy(() => import('./Reference').then(module => ({default:module.Catalog})))
const PartRecord = lazy(() => import('./Reference').then(module => ({default:module.PartRecord})))
const Comparison = lazy(() => import('./Comparison'))
const Archive = lazy(() => import('./Archive'))
const Installation = lazy(() => import('./Installation'))
const MetachronicLab = lazy(() => import('./MetachronicLab'))
const ScientificSystems = lazy(() => import('./ScientificSystems'))
const SimulationPanel = lazy(() => import('../components/SimulationPanel'))

const nav = [
  { path: 'explorer', name: 'Assembly', Icon: Box },
  { path: 'engineering', name: 'Engineering', Icon: BookOpen },
  { path: 'simulation', name: 'Test bench', Icon: FlaskConical },
  { path: 'bom', name: 'Part register', Icon: ClipboardList },
  { path: 'comparison', name: 'Comparison', Icon: GitCompareArrows },
  { path: 'archive', name: 'Archive', Icon: ArchiveIcon },
]
const currentRoute = () => readRoute(location.hash)
const modelGroups = [
  {label:'Project CAD',records:archive.filter(record=>record.kind==='Project assembly')},
  {label:'Archive CAD models',records:archive.filter(record=>archiveCad[record.id])},
  {label:'Source records and studies',records:archive.filter(record=>!workbenchHref(record))},
]
function remembered(model: MachineKey) {
  try { return sessionStorage.getItem(`${model}.selected`) ?? machines[model].defaultPart }
  catch { return machines[model].defaultPart }
}
export default function App() {
  const [route, setRoute] = useState(currentRoute)
  const [selected, setSelected] = useState<Record<MachineKey,string>>(() => ({te01:remembered('te01'),re01:remembered('re01'),me01:remembered('me01')}))
  const {model,page,param,view,detail}=route
  const machine=machines[model]
  const href=(path:string)=>machineRoute(model,path)
  const archived=page==='archive'&&param?archiveById.get(param):undefined
  const active=archived?.id??(page==='archive'?'':model)
  const archivedLinks:Record<string,string|undefined> = archived ? {
    explorer:workbenchHref(archived),engineering:archiveHref(archived.id),
    simulation:archived.study?archiveHref(archived.id,'study'):undefined,
    bom:archiveCad[archived.id]?archiveHref(archived.id,'bom'):undefined,
    comparison:'#/comparison',archive:'#/archive',
  } : {}
  useEffect(() => {
    const change = () => {
      setRoute(currentRoute())
      window.scrollTo(0, 0)
      requestAnimationFrame(() => document.getElementById('main')?.focus({ preventScroll: true }))
    }
    window.addEventListener('hashchange', change)
    return () => window.removeEventListener('hashchange', change)
  }, [])
  useEffect(()=>{
    document.title=page==='home'?'Encabulation Systems Inc | Research and engineering':page==='archive'?
      'Technical archive | Encabulation Systems Inc':`${machine.name} ${machine.code} | Encabulation Systems Inc`
  },[machine,page])
  const selectFor = (key: MachineKey, id: string) => {
    setSelected(previous=>({...previous,[key]:id}))
    try { sessionStorage.setItem(`${key}.selected`,id) } catch { /* The current tab still retains selection. */ }
  }
  const select = (id: string) => selectFor(model,id)
  const part=param?machine.registry.partById.get(param):undefined
  return <MachineContext.Provider value={machine}>
    <a className="skip-link" href="#main" onClick={event => { event.preventDefault(); document.getElementById('main')?.focus() }}>Skip to content</a>
    <header className="masthead">
      <div className="masthead-inner">
        <a className="brand" href="#/" aria-current={page==='home'?'page':undefined}><LabWordmark/></a>
        <nav aria-label="Primary navigation">
          {nav.map(({ path, name, Icon }) => {
            const destination=archived?archivedLinks[path]:path==='archive'?'#/archive':href(path)
            return destination&&<a key={path} href={destination}
              aria-current={destination===location.hash||page===path&&!archived||(page==='component'&&path==='bom')||(page==='diagnostics'&&path==='simulation')?'page':undefined}><Icon size={15} /><span>{name}</span></a>
          })}
        </nav>
      </div>
    </header>
    {page!=='home'&&<div className="machine-bar">
      <nav aria-label="Configuration navigation">
        <label>View configuration <select value={active} onChange={event=>{
          const record=archiveById.get(event.target.value)
          if(!record)return
          const stayInLab=page==='simulation'||page==='diagnostics'||view==='study'
          const lab=isMachineKey(record.id)?machineRoute(record.id,'simulation'):
            record.study?archiveHref(record.id,'study'):undefined
          location.hash=(stayInLab?lab:undefined)??workbenchHref(record)??archiveHref(record.id)
        }}>
          <option value="" disabled>Choose a configuration</option>
          {modelGroups.map(({label,records})=>
            <optgroup key={label} label={label}>{records.map(record=>
              <option key={record.id} value={record.id}>{record.name} · {record.code}</option>)}</optgroup>)}
        </select></label>
        <a href={archiveHref()}>Search the archive</a>
      </nav>
    </div>}
    <main className={page==='home'?'shell portal-shell':'shell'} id="main" tabIndex={-1}>
      <Suspense fallback={<div className="viewer-loading">Loading technical record…</div>}>
        {page === 'home' ? <Home selected={selected.me01} onSelect={id=>selectFor('me01',id)} />
          : page === 'archive' ? <Archive id={param} view={view} detail={detail} />
          : page === 'explorer' ? <Explorer key={model} selected={selected[model]} onSelect={select} />
          : page === 'engineering' ? <Reference key={model} section={param} />
          : page === 'bom' ? <Catalog key={model} />
          : page === 'comparison' ? <Comparison />
          : page === 'installation' ? <Installation />
          : part && page === 'component' ? <PartRecord part={part} onSelect={select} />
          : page === 'systems' && model==='me01' ? <ScientificSystems id={param} key={param} />
          : (page === 'simulation'||page==='diagnostics') && model==='me01' ? <MetachronicLab key={param} initialHost={param}
              view={telemetry=><Explorer selected={selected[model]} onSelect={select} telemetry={telemetry} lab/>} />
          : page === 'simulation' ? <SimulationPanel key={`${model}:${page}`} lab={<Explorer selected={selected[model]} onSelect={select} lab/>} />
          : page === 'diagnostics' ? <SimulationPanel key={`${model}:${page}`} initial="integrated"
            diagnostic={telemetry => <Explorer selected={selected[model]} onSelect={select} telemetry={telemetry} />} />
          : <header className="page-header"><div><h1>Record unavailable</h1><a href={href('explorer')}>Return to assembly</a></div></header>}
      </Suspense>
    </main>
    <footer className="site-footer"><span>Encabulation Systems Inc</span><a href="https://github.com/RRG314/encabulator-lab">Encabulator Lab repository</a></footer>
  </MachineContext.Provider>
}
