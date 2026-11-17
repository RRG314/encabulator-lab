import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { archiveById, archiveCad, archiveProfile } from '../src/machines/archive'
import { machines } from '../src/machines/profiles'

type GlbDocument = {
  nodes: { name: string; mesh: number; extras: { partId: string }; translation: number[]; rotation: number[] }[]
  meshes: { name: string; primitives: unknown[] }[]
}

type Conformance = {
  models: {
    code: string; physicalDefinitions: number; placements: number; componentSheets: number
    poses: Record<'assembled' | 'exploded', { step: string; native: string; drawing: string }>
    artifactsSha256: string; files: string[]
  }[]
}

const asset = (path: string) => resolve('public', path)
const report = JSON.parse(readFileSync(asset('models/assembly-conformance.json'), 'utf8')) as Conformance
const profiles = [...Object.values(machines), ...Object.entries(archiveCad).map(([slug, model]) => archiveProfile(archiveById.get(slug)!, model))]

describe('drawing and mesh coverage', () => {
  for (const profile of profiles) {
    it(`retains every ${profile.code} physical part and CAD placement in the browser`, () => {
      const physical = profile.registry.parts.filter(part => part.kind !== 'logical')
      const glb = readFileSync(asset(profile.mesh))
      const { meshes, nodes } = JSON.parse(glb.toString('utf8', 20, 20 + glb.readUInt32LE(12))) as GlbDocument
      expect(meshes.map(mesh => mesh.name).sort()).toEqual(physical.map(part => part.id).sort())
      expect(meshes.every(mesh => mesh.primitives.length > 0)).toBe(true)
      expect(nodes.map(node => node.name)).toEqual(profile.placements.map(row => row.key))
      nodes.forEach((node, i) => {
        const row = profile.placements[i]
        const [x, y, z] = row.origin
        expect(node.extras.partId).toBe(row.partId)
        expect(meshes[node.mesh].name).toBe(row.partId)
        const expected = [x / 1000, z / 1000, -y / 1000]
        node.translation.forEach((value, axis) => expect(value).toBeCloseTo(expected[axis], 12))
        expect(node.rotation[0]).toBeCloseTo(Math.sin(row.rotation / 2), 12)
        expect(node.rotation.slice(1, 3)).toEqual([0, 0])
        expect(node.rotation[3]).toBeCloseTo(Math.cos(row.rotation / 2), 12)
      })
      for (const part of physical) {
        expect(existsSync(asset(part.cadAssetPath!))).toBe(true)
        expect(readFileSync(asset(part.diagramRefs[0]), 'utf8')).toContain(`<title>${part.id} `)
      }
      expect(profile.drawings.every(path => existsSync(asset(path)))).toBe(true)
      const check = report.models.find(model => model.code === profile.code)
      expect(check).toMatchObject({
        physicalDefinitions: physical.length, placements: nodes.length, componentSheets: physical.length,
        poses: {
          assembled: { step: 'PASS', native: 'PASS', drawing: 'PASS' },
          exploded: { step: 'PASS', native: 'PASS', drawing: 'PASS' },
        },
      })
      const files = check!.files
      const linked = [profile.mesh, ...profile.drawings, ...physical.flatMap(part => [part.cadAssetPath!, part.diagramRefs[0]])]
      expect(files).toEqual(expect.arrayContaining(linked))
      expect(new Set(files).size).toBe(linked.length + 4)
      const fingerprint = createHash('sha256')
      for (const name of files) {
        fingerprint.update(`${name}\0`)
        fingerprint.update(createHash('sha256').update(readFileSync(asset(name))).digest())
      }
      expect(fingerprint.digest('hex')).toBe(check!.artifactsSha256)
    })
  }

  it('preserves separately documented GE-62 external and internal stations', () => {
    const layout = archiveCad['ge-1962'].placements
    expect(layout.filter(row => row.partId === 'GE-021')).toHaveLength(6)
    expect(new Set(layout.filter(row => row.partId === 'GE-021').map(row => row.rotation)).size).toBe(6)
    expect(layout.filter(row => row.partId === 'GE-022')).toHaveLength(47)
    expect(layout.filter(row => row.partId === 'GE-023')).toHaveLength(47)
  })
})
