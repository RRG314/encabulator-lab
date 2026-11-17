import { ArrowUpRight, Box, Crosshair, FileText, Layers } from 'lucide-react'
import { useMachine } from '../machines/context'
import { dimensionText } from '../machines/profiles'
import type { Part } from '../schemas/part'

export function PartInspector({ part, isolated, onIsolate, onFocus }: { part: Part, isolated: boolean, onIsolate: () => void, onFocus: () => void }) {
  const machine=useMachine()
  const {assemblyById}=machine.registry
  const service=machine.service[part.id]
  return <aside className="inspector panel" aria-label="Component inspector">
    <div className="panel-title"><Crosshair size={16} /><h2>Component inspector</h2></div>
    <div className="inspector-body">
      <div className="part-code"><Box size={15} /><span>{part.id}</span><span className="mini-tag">{part.kind === 'physical' ? 'PRELIMINARY' : part.kind.toUpperCase()}</span></div>
      <h3>{part.name}</h3>
      <p className="part-description">{part.description}</p>
      <dl>
        <div><dt>Assembly</dt><dd>{assemblyById.get(part.assemblyId)?.shortName}</dd></div>
        <div><dt>Quantity</dt><dd>{part.quantity}</dd></div>
        <div><dt>Material</dt><dd>{part.material ?? 'To be determined'}</dd></div>
        <div><dt>Dimensions</dt><dd>{dimensionText(part,service)}</dd></div>
        <div><dt>Service tool</dt><dd>{service?.tool ?? 'Selection pending'}</dd></div>
        <div><dt>Revision</dt><dd>{part.revision}</dd></div>
      </dl>
      <section className="inspector-mount"><h4>Mounting interface</h4><p>{part.mounting}</p></section>
      <div className="inspector-actions">
        <button className="secondary-button" type="button" onClick={onFocus}><Crosshair size={14}/> Focus component</button>
        <a className="primary-button" href={machine.href(`component/${part.id}`)}><FileText size={15} />Engineering record<ArrowUpRight size={14} /></a>
        <button className="secondary-button" type="button" onClick={onIsolate} aria-pressed={isolated}><Layers size={14} />{isolated ? 'Show assembly' : 'Isolate component'}</button>
      </div>
    </div>
  </aside>
}
