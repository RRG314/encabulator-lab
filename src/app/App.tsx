import { BookOpen, Box, ClipboardList, Component, FlaskConical, GitCompareArrows } from 'lucide-react'
import { lazy, Suspense, useEffect, useState } from 'react'
import { MachineContext } from '../machines/context'
import { machineRoute, machines, readRoute } from '../machines/profiles'
import type { MachineKey } from '../machines/profiles'
import { Explorer } from './Explorer'

const Reference = lazy(() => import('./Reference'))
const Catalog = lazy(() => import('./Reference').then(module => ({default:module.Catalog})))
const PartRecord = lazy(() => import('./Reference').then(module => ({default:module.PartRecord})))
const Comparison = lazy(() => import('./Comparison'))
const SimulationPanel = lazy(() => import('../components/SimulationPanel'))

const nav = [
  { path: 'explorer', name: 'Assembly', Icon: Box },
  { path: 'engineering', name: 'Engineering', Icon: BookOpen },
  { path: 'simulation', name: 'Test bench', Icon: FlaskConical },
  { path: 'bom', name: 'Part register', Icon: ClipboardList },
  { path: 'comparison', name: 'Comparison', Icon: GitCompareArrows },
]
const currentRoute = () => readRoute(location.hash)
function remembered(model: MachineKey) {
  try { return sessionStorage.getItem(`${model}.selected`) ?? machines[model].defaultPart }
  catch { return machines[model].defaultPart }
}
export default function App() {
  const [route, setRoute] = useState(currentRoute)
  const [selected, setSelected] = useState<Record<MachineKey,string>>(() => ({te01:remembered('te01'),re01:remembered('re01')}))
  const {model,page,param}=route
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
  useEffect(()=>{ document.title=`${machine.name} ${machine.code} | Encabulator Engineering` },[machine])
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
          <span>Encabulator Engineering</span></a>
        <nav aria-label="Primary navigation">
          {nav.map(({ path, name, Icon }) => <a key={path} href={href(path)}
            aria-current={page === path || (page === 'component' && path === 'bom') || (page === 'diagnostics' && path === 'simulation') ? 'page' : undefined}><Icon size={15} /><span>{name}</span></a>)}
        </nav>
      </div>
    </header>
    <div className="machine-bar">
      <nav aria-label="Machine model">
        {Object.values(machines).map(item=><a key={item.key} aria-current={item.key===model?'page':undefined}
          href={machineRoute(item.key,page==='component'?'explorer':[page,param].filter(Boolean).join('/'))}>
          <strong>{item.code}</strong><span>{item.name}</span>
        </a>)}
      </nav>
    </div>
    <main className="shell" id="main" tabIndex={-1}>
      <Suspense fallback={<div className="viewer-loading">Loading technical record…</div>}>
        {page === 'explorer' ? <Explorer key={model} selected={selected[model]} onSelect={select} />
          : page === 'engineering' ? <Reference key={model} section={param} />
          : page === 'bom' ? <Catalog key={model} />
          : page === 'comparison' ? <Comparison />
          : part && page === 'component' ? <PartRecord part={part} onSelect={select} />
          : page === 'simulation' ? <SimulationPanel key={`${model}:${page}`} />
          : page === 'diagnostics' ? <SimulationPanel key={`${model}:${page}`} initial="integrated"
            diagnostic={telemetry => <Explorer selected={selected[model]} onSelect={select} telemetry={telemetry} />} />
          : <header className="page-header"><div><h1>Record unavailable</h1><a href={href('explorer')}>Return to assembly</a></div></header>}
      </Suspense>
    </main>
    <footer className="site-footer"><span>Encabulator Engineering · SI units</span><a href="https://github.com/RRG314/turbo-encabulator">Source and contributions</a></footer>
  </MachineContext.Provider>
}
