import { Component } from 'react'
import type { ReactNode } from 'react'
import { partById } from '../data'
import { explodePosition, placements } from '../model/layout'
import type { ViewerProps } from './Viewer3D'

export class GraphicsBoundary extends Component<{ children: ReactNode, fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? this.props.fallback : this.props.children }
}

export function supportsWebGL() {
  try {
    const context = document.createElement('canvas').getContext('webgl2')
    if (!context) return false
    context.getExtension('WEBGL_lose_context')?.loseContext()
    return true
  } catch { return false }
}

export function ViewerFallback({ selected, visible, fraction, onSelect }: ViewerProps) {
  return <div className="fallback">
    <strong>Schematic elevation</strong>
    <p>WebGL is unavailable. Select a station or use the assembly tree.</p>
    <svg viewBox="-260 -420 520 550" role="group" aria-label="Interactive elevation of TE-01 component stations">
      <path d="M -155 0 H 155 M -145 -58 H 125" stroke="#626a73" strokeDasharray="4 4" />
      {placements.filter(item => visible.has(item.partId) && item.partId !== 'TE-029').map(item => {
        const [x,y,z] = explodePosition(item, fraction)
        return <g key={item.key} tabIndex={0} role="button" aria-label={`${item.partId} ${partById.get(item.partId)?.name}`}
          className={selected === item.partId ? 'current' : ''} transform={`translate(${x+y*0.19},${-z+y*0.2})`}
          onClick={() => onSelect(item.partId)} onKeyDown={event => {
            if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(item.partId) }
          }}>
          <title>{partById.get(item.partId)?.name}</title>
          <circle r="6" />
        </g>
      })}
    </svg>
  </div>
}
