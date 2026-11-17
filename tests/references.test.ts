import { readFileSync } from 'node:fs'
import { describe,expect,it } from 'vitest'
import { assemblies, partById, parts } from '../src/data'
import { functionalGroups, service } from '../src/schemas/reference'
import { simulations } from '../src/schemas/simulation'
import { study } from '../src/simulation/studies'

describe('technical reference', () => {
  it('has failure descriptions and valid two-way routes for all 30 components', () => {
    expect(Object.keys(service).sort()).toEqual(parts.map(part=>part.id))
    expect(functionalGroups.flatMap(g=>g.assemblies).sort()).toEqual(assemblies.map(g=>g.id).sort())
    expect(functionalGroups.every(g=>g.interfaces.every(id=>partById.has(id)))).toBe(true)
    expect(parts.every(part=>part.mounting && part.maintenance && part.verification && part.diagramRefs.length)).toBe(true)
  })

  it('includes each physical registry ID in the generated GLB', () => {
    const file=readFileSync(new URL('../public/models/te01.glb',import.meta.url))
    expect(file.toString('utf8',0,4)).toBe('glTF')
    expect(file.readUInt32LE(8)).toBe(file.byteLength)
    const mesh=JSON.parse(file.toString('utf8',20,20+file.readUInt32LE(12))) as {meshes:{name:string}[]}
    expect(mesh.meshes.map(row=>row.name).sort()).toEqual(parts.filter(part=>part.kind!=='logical').map(part=>part.id))
  })

  it('evaluates all parameter presets at baseline and range bounds', () => {
    expect(new Set(simulations.map(row=>row.id)).size).toBe(10)
    for (const row of simulations) {
      for (const key of ['default','min','max'] as const) {
        const params=Object.fromEntries(row.inputs.map(input=>[input.id,input[key]]))
        const runs=study(row.id,params,'None',false)
        for(const chart of runs.charts) for (const series of chart.series) {
          expect(series.data).toHaveLength(chart.x.length)
          expect(series.data.every(v=>v===null || Number.isFinite(v))).toBe(true)
        }
      }
    }
  })
})
