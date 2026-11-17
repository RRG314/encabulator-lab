import { Box, ChevronDown, ChevronRight, Eye, EyeOff, Layers, Search, X } from 'lucide-react'
import { useState } from 'react'
import { useAssembly } from '../machines/context'
import type { AssemblyId } from '../schemas/part'

export function PartsTree({ selected, onSelect, scope, onScope, hidden, toggleHidden }: {
  selected: string, onSelect: (id: string) => void, scope: AssemblyId | null,
  onScope: (id: AssemblyId | null) => void, hidden: ReadonlySet<string>, toggleHidden: (id: string) => void,
}) {
  const machine=useAssembly()
  const {assemblies,partById}=machine.registry
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const normalized = query.trim().toLowerCase()
  const matches = (id: string) => {
    const part = partById.get(id)!
    return `${id} ${part.name} ${part.assemblyId}`.toLowerCase().includes(normalized)
  }
  const count = assemblies.reduce((total, assembly) => total + assembly.partIds.filter(matches).length, 0)
  return <aside className="tree panel" aria-label="Assembly hierarchy">
    <div className="panel-title"><Layers size={16} /><h2>Assembly hierarchy</h2><span className="count">{String(assemblies.length).padStart(2,'0')}</span></div>
    <div className="tree-search">
      <Search size={15} /><input type="search" aria-label="Search components" placeholder="Find a part or ID…" value={query}
        onChange={event => setQuery(event.target.value)} />
      {query && <button type="button" className="icon-button" aria-label="Clear search" onClick={() => setQuery('')}><X size={13} /></button>}
    </div>
    <div className="tree-body">
      <button className={scope ? 'tree-root' : 'tree-root active'} type="button" onClick={() => onScope(null)}>
        <Box size={16} /><span>{machine.code} · Complete assembly</span>
      </button>
      {count === 0 && <p className="empty-tree">No component matches this search.</p>}
      {assemblies.map(assembly => {
        const ids = assembly.partIds.filter(matches)
        if (!ids.length && normalized) return null
        const open = normalized ? true : expanded[assembly.id] ?? (assembly.id === 'HMA' || assembly.id === 'RE-300' || assembly.partIds.includes(selected))
        return <div className="tree-assembly" key={assembly.id}>
          <div className={scope === assembly.id ? 'tree-group scoped' : 'tree-group'}>
            <button type="button" aria-expanded={open}
              onClick={() => setExpanded(previous => ({ ...previous, [assembly.id]: !open }))}>
              {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}<span>{assembly.shortName}</span>
              <small>{ids.length}</small>
            </button>
            <button type="button" className="icon-button scope-button" aria-label={`Isolate ${assembly.shortName}`}
              aria-pressed={scope === assembly.id} disabled={assembly.partIds.every(id=>partById.get(id)?.kind==='logical')} onClick={() => onScope(scope === assembly.id ? null : assembly.id)}
              title={`Isolate ${assembly.shortName}`}><Layers size={13} /></button>
          </div>
          {open && <ul>{ids.map(id => {
            const part = partById.get(id)!
            return <li key={id} className={selected === id ? 'current' : ''}>
              <button className="tree-part" type="button" aria-current={selected === id ? 'true' : undefined}
                onClick={() => onSelect(id)}><i /><span>{part.name}</span><small>{part.quantity === 1 ? '' : `×${part.quantity}`}</small></button>
              <button type="button" className="icon-button hide-part" aria-label={`${hidden.has(id) ? 'Show' : 'Hide'} ${part.name}`}
                disabled={part.kind==='logical'} onClick={() => toggleHidden(id)}>{hidden.has(id) ? <EyeOff size={13} /> : <Eye size={13} />}</button>
            </li>
          })}</ul>}
        </div>
      })}
    </div>
  </aside>
}
