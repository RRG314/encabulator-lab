import type { Vec3 } from './geometry'

import model from '../../data/model-layout.json'

export const shaftHeight = model.shaftHeight
export const journalStations = model.journalStations
export const homeDirection: Vec3 = [0.57, -1, 0.63]

export interface Placement {
  key: string
  partId: string
  origin: Vec3
  offset: Vec3
  stage: number
  rotation: number
}

export const placements = model.placements as Placement[]

export function explodePosition(placement: Placement, fraction: number): Vec3 {
  const start = placement.stage * 0.061
  const t = Math.max(0, Math.min(1, (fraction - start) / (1 - start)))
  if (t === 0) return placement.origin
  const phase = t * t * (3 - 2 * t)
  return [
    placement.origin[0] + placement.offset[0] * phase,
    placement.origin[1] + placement.offset[1] * phase,
    placement.origin[2] + placement.offset[2] * phase,
  ]
}
