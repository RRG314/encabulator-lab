import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { integrityErrors } from '../src/data'
import { archive, archiveById, archiveCad, archiveProfile, sourceById, sources, workbenchHref } from '../src/machines/archive'
import { machines, readRoute } from '../src/machines/profiles'
import { explodePosition } from '../src/model/layout'
import { archiveStudies, runArchiveStudy } from '../src/simulation/archive'
import type { ArchiveStudy } from '../src/machines/archive'
import { compareInstallation, installations } from '../src/simulation/metachronic/installation'
import type { Options } from '../src/simulation/metachronic/plant'

const publicPath=(path:string)=>join(process.cwd(),'public',path)
const unique=(items:string[])=>expect(new Set(items).size).toBe(items.length)

describe('historical machine and source register',()=>{
  it('resolves the machine lineage, source citations and assembly routes',()=>{
    unique(archive.map(record=>record.id))
    unique(archive.map(record=>record.code))
    unique(sources.map(source=>source.id))
    for(const record of archive){
      const validSources=record.sourceIds.every(id=>sourceById.has(id))
      expect(validSources).toBe(true)
      expect(record.related.every(id=>archiveById.has(id)&&id!==record.id)).toBe(true)
      expect(record.components.every(([,id])=>record.sourceIds.includes(id))).toBe(true)
      if(record.kind==='CAD reconstruction')expect(record.study&&workbenchHref(record)).toBeTruthy()
      if(record.kind==='Computational analogue')expect(record.study).toBeDefined()
    }
    expect(readRoute('#/archive/magneto-2022/component/MT-005')).toMatchObject({page:'archive',param:'magneto-2022',view:'component',detail:'MT-005'})
  })
  it('matches all manifest records and downloadable files to the exported solids',()=>{
    unique([...Object.values(machines).flatMap(machine=>machine.registry.parts.map(part=>part.id)),
      ...Object.entries(archiveCad).flatMap(([id,model])=>archiveProfile(archiveById.get(id)!,model).registry.parts.map(part=>part.id))])
    for(const [id,model] of Object.entries(archiveCad)){
      const source=archiveById.get(id)!
      const profile=archiveProfile(source,model)
      expect(integrityErrors(profile.registry)).toEqual([])
      unique(model.placements.map(item=>item.key))
      for(const part of profile.registry.parts) {
        expect(model.placements.filter(placement=>placement.partId===part.id)).toHaveLength(part.quantity as number)
        expect(existsSync(publicPath(part.cadAssetPath!))).toBe(true)
        expect(part.diagramRefs.every(path=>existsSync(publicPath(path)))).toBe(true)
        const reference=profile.service[part.id].originSource
        expect(!reference||source.sourceIds.includes(reference)).toBe(true)
      }
      for(const asset of model.assets)expect(existsSync(publicPath(asset.path))).toBe(true)
      expect(JSON.parse(readFileSync(publicPath(model.assetFolder+'/manifest.json'),'utf8'))).toEqual(model)
      const mesh=readFileSync(publicPath(model.mesh))
      expect(mesh.subarray(0,4).toString()).toBe('glTF')
      const header=JSON.parse(mesh.subarray(20,20+mesh.readUInt32LE(12)).toString()) as {nodes:{name:string}[]}
      expect(header.nodes.map(node=>node.name)).toEqual(model.placements.map(p=>p.key))
      const report=JSON.parse(readFileSync(publicPath(model.assetFolder+'/validation.json'),'utf8')) as {checks:{status:string}[]}
      expect(report.checks.every(check=>check.status==='PASS')).toBe(true)
      for(const part of profile.placements) {
        expect(explodePosition(part,0)).toEqual(part.origin)
        expect(explodePosition(part,1)).toEqual(part.origin.map((value,i)=>value+part.offset[i]))
        expect(explodePosition(part,0)).toEqual(part.origin)
      }
    }
  })
})

describe('bounded model-specific studies',()=>{
  for(const [key,study] of Object.entries(archiveStudies)){
    it(`keeps ${key} finite at minimum, nominal and maximum input`,()=>{
      for(const limit of ['min','initial','max'] as const){
        for(const fault of [false,true]){
          const input=study.inputs.map(row=>row[limit])
          const result=runArchiveStudy(key as ArchiveStudy,input,fault)
          expect(result.frames.length).toBe(201)
          expect(result.frames.every(frame=>frame.values.every(Number.isFinite))).toBe(true)
          expect(result.frames.at(-1)?.status).toBe('Controlled shutdown')
        }
      }
    })
  }
  it('preserves probability and inhibits stale supervisory data',()=>{
    const markov=runArchiveStudy('markov',[.25,.65],true)
    expect(markov.frames.every(frame=>Math.abs(frame.values.reduce((sum,value)=>sum+value,0)-1)<1e-12)).toBe(true)
    const interlock=runArchiveStudy('interlock',[.8,.2],true)
    expect(interlock.frames[82].values[1]).toBe(.8)
    expect(interlock.frames[90].values[1]).toBe(0)
    expect(interlock.frames[145].values[1]).toBe(.8)
  })
  it('matches series resonance and the independently calculated RC step',()=>{
    const natural=1/(2*Math.PI*Math.sqrt(.04*160e-6))
    expect(runArchiveStudy('reactive',[natural,12,12]).frames[160].values[1]).toBeCloseTo(0,10)
    expect(runArchiveStudy('charge',[12,45]).frames[20].values[0]).toBeCloseTo(12*(1-Math.exp(-1/(45*.022))),8)
  })
  it('changes delivery when a path becomes unavailable and routes to standby',()=>{
    const routing=runArchiveStudy('routing',[80,.6,60],true)
    expect(routing.frames[60].values).toEqual([80,80])
    expect(routing.frames[84].values).toEqual([0,80])
    expect(routing.frames[108].values).toEqual([60,80])
  })
  it('compares analytically distinct direct and coupled host boundaries on the same time grid',()=>{
    for(const host of Object.keys(installations) as Options['host'][]){
      const study=compareInstallation(host,1500)
      expect(study.base.map(x=>x.t)).toEqual(study.nominal.map(x=>x.t))
      expect(study.alternative.every(frame=>Number.isFinite(frame.secondaryRpm))).toBe(true)
      expect(study.nominal.at(-1)?.secondaryRpm).not.toBe(study.alternative.at(-1)?.secondaryRpm)
    }
  })
})
