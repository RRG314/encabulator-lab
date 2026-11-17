import { Box3, Euler, Matrix4, Vector3 } from 'three'
import { describe, expect, it } from 'vitest'
import { parts } from '../src/data'
import { makeGeometries } from '../src/model/geometry'
import { explodePosition, journalStations, placementBounds, placements, shaftHeight } from '../src/model/layout'

const geometry = makeGeometries()
describe('schematic model', () => {
  it('assigns separate geometry to every registry part and preserves BOM quantities', () => {
    expect(Object.keys(geometry).sort()).toEqual(parts.map(part => part.id))
    expect(new Set(placements.map(placement => placement.key)).size).toBe(placements.length)
    const compact = makeGeometries(true)
    for (const part of parts) {
      expect(compact[part.id].length).toBeGreaterThan(0)
      const instances = placements.filter(placement => placement.partId === part.id)
      expect(instances.length).toBeGreaterThan(0)
      if (typeof part.quantity === 'number') expect(instances).toHaveLength(part.quantity)
    }
  })

  it('indexes identical vanes and aligns the shaft with both journal centers', () => {
    const vanes = placements.filter(p => p.partId === 'TE-009')
    vanes.forEach((vane, i) => {
      expect(vane.rotation).toBeCloseTo(i * Math.PI / 3)
      expect(Math.hypot(vane.origin[1], vane.origin[2] - shaftHeight)).toBeCloseTo(16)
    })
    for (const id of ['TE-006', 'TE-007']) {
      expect(placements.filter(p => p.partId === id).map(p => p.origin))
        .toEqual(journalStations.map(x => [x, 0, shaftHeight]))
    }
    expect(placements.find(p => p.partId === 'TE-005')!.origin.slice(1)).toEqual([0, shaftHeight])
  })

  it('starts on the assembled datum and preserves separation under rigid transforms', () => {
    const rigid = new Matrix4().makeRotationFromEuler(new Euler(0.4, 0.6, -0.3)).setPosition(22, -17, 30)
    for (const p of placements) {
      expect(explodePosition(p, 0)).toEqual(p.origin)
      const a = new Vector3(...explodePosition(p, 0))
      const b = new Vector3(...explodePosition(p, 1))
      expect(a.distanceTo(b)).toBeCloseTo(a.applyMatrix4(rigid).distanceTo(b.applyMatrix4(rigid)), 8)
    }
  })

  it('separates schematic part bounding boxes at full explosion', () => {
    const overlaps: string[] = []
    const bounds = placements.map(p => [p, placementBounds(p, 1, geometry)] as const)
    bounds.forEach(([p, a], i) => {
      for (const [q, b] of bounds.slice(i+1)) {
        const intersection = new Box3().copy(a).intersect(b).getSize(new Vector3())
        if (Math.min(intersection.x, intersection.y, intersection.z) > 0.2) overlaps.push(`${p.key} / ${q.key}`)
      }
    })
    expect(overlaps).toEqual([])
  })
})
