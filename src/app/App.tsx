import { BookOpen, Box, CircuitBoard, ClipboardList, Component, FlaskConical } from 'lucide-react'
import { useEffect, useState } from 'react'
import { partById } from '../data'
import { Explorer } from './Explorer'

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
            aria-current={page === path || (page === 'component' && path === 'bom') ? 'page' : undefined}><Icon size={15} /><span>{name}</span></a>)}
        </nav>
        <div className="header-class"><CircuitBoard size={15} /><span>TECHNICAL REFERENCE</span></div>
      </div>
    </header>
    <main className="shell" id="main" tabIndex={-1}>
      {page === 'explorer' ? <Explorer selected={selected} onSelect={select} />
        : part ? <article className="page-header"><div><div className="eyebrow">{part.id} / REV {part.revision}</div>
          <h1>{part.name}</h1><p>{part.description}</p><a href="#/explorer" onClick={() => select(part.id)}>Locate in explorer</a></div></article>
          : <header className="page-header"><h1>{nav.find(item => item.path === page)?.name ?? 'Record unavailable'}</h1></header>}
    </main>
    <footer className="site-footer"><span>TE-01 Engineering Reference</span><span>SI units · Revision 0.1</span></footer>
  </>
}
