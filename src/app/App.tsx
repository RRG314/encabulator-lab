import { BookOpen, Box, CircuitBoard, ClipboardList, Component, FlaskConical } from 'lucide-react'
import { lazy, Suspense, useEffect, useState } from 'react'
import { partById } from '../data'
import { Explorer } from './Explorer'

const Reference = lazy(() => import('./Reference'))
const Catalog = lazy(() => import('./Reference').then(module => ({default:module.Catalog})))
const PartRecord = lazy(() => import('./Reference').then(module => ({default:module.PartRecord})))
const SimulationPanel = lazy(() => import('../components/SimulationPanel'))

const nav = [
  { path: 'explorer', name: 'Explorer', Icon: Box },
  { path: 'engineering', name: 'Engineering', Icon: BookOpen },
  { path: 'simulation', name: 'Simulations', Icon: FlaskConical },
  { path: 'bom', name: 'Parts catalog', Icon: ClipboardList },
]
const currentRoute = () => location.hash.replace(/^#\/?/, '') || 'explorer'

export default function App() {
  const [route, setRoute] = useState(currentRoute)
  const [selected, setSelected] = useState(() => sessionStorage.getItem('te01.selected') ?? 'TE-009')
  useEffect(() => {
    const change = () => {
      setRoute(currentRoute())
      window.scrollTo(0, 0)
      requestAnimationFrame(() => document.getElementById('main')?.focus({ preventScroll: true }))
    }
    window.addEventListener('hashchange', change)
    return () => window.removeEventListener('hashchange', change)
  }, [])
  const select = (id: string) => { setSelected(id); sessionStorage.setItem('te01.selected', id) }
  const [page, param] = route.split('/')
  const part = partById.get(param)
  return <>
    <a className="skip-link" href="#main" onClick={event => { event.preventDefault(); document.getElementById('main')?.focus() }}>Skip to content</a>
    <header className="masthead">
      <div className="masthead-inner">
        <a className="brand" href="#/explorer"><div className="brand-mark"><Component size={24} strokeWidth={1.7} /></div>
          <span>Turbo Encabulator<small>TE-01</small></span></a>
        <nav aria-label="Primary navigation">
          {nav.map(({ path, name, Icon }) => <a key={path} href={`#/${path}`}
            aria-current={page === path || (page === 'component' && path === 'bom') || (page === 'diagnostics' && path === 'simulation') ? 'page' : undefined}><Icon size={15} /><span>{name}</span></a>)}
        </nav>
        <div className="header-class"><CircuitBoard size={15} /><span>TECHNICAL REFERENCE</span></div>
      </div>
    </header>
    <main className="shell" id="main" tabIndex={-1}>
      <Suspense fallback={<div className="viewer-loading">Loading technical record…</div>}>
        {page === 'explorer' ? <Explorer selected={selected} onSelect={select} />
          : page === 'engineering' ? <Reference section={param} />
          : page === 'bom' ? <Catalog />
          : part && page === 'component' ? <PartRecord part={part} onSelect={select} />
          : page === 'simulation' ? <SimulationPanel key={page} />
          : page === 'diagnostics' ? <SimulationPanel key={page} initial="integrated"
            diagnostic={telemetry => <Explorer selected={selected} onSelect={select} telemetry={telemetry} />} />
          : <header className="page-header"><div><h1>Record unavailable</h1><a href="#/explorer">Return to assembly</a></div></header>}
      </Suspense>
    </main>
    <footer className="site-footer"><span>TE-01 Engineering Reference</span><span>SI units · Revision 0.1</span></footer>
  </>
}
