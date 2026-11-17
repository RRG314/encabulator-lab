import { Archive as ArchiveIcon, BookOpen, Box, ClipboardList, Component, FlaskConical, GitCompareArrows } from 'lucide-react'
import { lazy, Suspense, useEffect, useState } from 'react'
import { MachineContext } from '../machines/context'
import { machineRoute, machines, readRoute } from '../machines/profiles'
import type { MachineKey } from '../machines/profiles'
import { Explorer } from './Explorer'

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
  useEffect(() => {
    const change = () => {
      setRoute(currentRoute())
      window.scrollTo(0, 0)
      requestAnimationFrame(() => document.getElementById('main')?.focus({ preventScroll: true }))
    }
    window.addEventListener('hashchange', change)
    return () => window.removeEventListener('hashchange', change)
  }, [])
  useEffect(()=>{ document.title=page==='archive'?'Technical Archive | Encabulator Systems':`${machine.name} ${machine.code} | Encabulator Systems` },[machine,page])
  const select = (id: string) => {
    setSelected(previous=>({...previous,[model]:id}))
    try { sessionStorage.setItem(`${model}.selected`,id) } catch { /* The current tab still retains selection. */ }
  }
  const part=machine.registry.partById.get(param)
  return <MachineContext.Provider value={machine}>
    <a className="skip-link" href="#main" onClick={event => { event.preventDefault(); document.getElementById('main')?.focus() }}>Skip to content</a>
    <header className="masthead">
      <div className="masthead-inner">
        <a className="brand" href={href('explorer')}><div className="brand-mark"><Component size={23} strokeWidth={1.65} /></div>
          <span>Encabulator Systems</span></a>
        <nav aria-label="Primary navigation">
          {nav.map(({ path, name, Icon }) => <a key={path} href={path==='archive'?'#/archive':href(path)}
            aria-current={page === path || (page === 'component' && path === 'bom') || (page === 'diagnostics' && path === 'simulation') ? 'page' : undefined}><Icon size={15} /><span>{name}</span></a>)}
        </nav>
      </div>
    </header>
    <div className="machine-bar">
      <nav aria-label="Machine model">
        {Object.values(machines).map(item=><a key={item.key} aria-current={item.key===model?'page':undefined}
          href={machineRoute(item.key,['component','systems','archive'].includes(page)?'explorer':[page,param].filter(Boolean).join('/'))}>
          <strong>{item.code}</strong><span>{item.name}</span>
        </a>)}
      </nav>
    </div>
    <main className="shell" id="main" tabIndex={-1}>
      <Suspense fallback={<div className="viewer-loading">Loading technical record…</div>}>
        {page === 'archive' ? <Archive id={param} view={view} detail={detail} />
          : page === 'explorer' ? <Explorer key={model} selected={selected[model]} onSelect={select} />
          : page === 'engineering' ? <Reference key={model} section={param} />
          : page === 'bom' ? <Catalog key={model} />
          : page === 'comparison' ? <Comparison />
          : page === 'installation' ? <Installation />
          : part && page === 'component' ? <PartRecord part={part} onSelect={select} />
          : page === 'systems' && model==='me01' ? <ScientificSystems id={param} key={param} />
          : (page === 'simulation'||page==='diagnostics') && model==='me01' ? <MetachronicLab
              view={telemetry=><Explorer selected={selected[model]} onSelect={select} telemetry={telemetry} />} />
          : page === 'simulation' ? <SimulationPanel key={`${model}:${page}`} />
          : page === 'diagnostics' ? <SimulationPanel key={`${model}:${page}`} initial="integrated"
            diagnostic={telemetry => <Explorer selected={selected[model]} onSelect={select} telemetry={telemetry} />} />
          : <header className="page-header"><div><h1>Record unavailable</h1><a href={href('explorer')}>Return to assembly</a></div></header>}
      </Suspense>
    </main>
    <footer className="site-footer"><span>Encabulator Systems · SI units</span><a href="https://github.com/RRG314/turbo-encabulator">Source and contributions</a></footer>
  </MachineContext.Provider>
}
