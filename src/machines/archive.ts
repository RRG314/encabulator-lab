import { z } from 'zod'
import sourcesJson from '../../data/archive/sources.json'
import recordsJson from '../../data/archive/records.json'
import cadJson from '../../data/archive/cad.json'
import { registry } from '../data'
import type { Placement } from '../model/layout'
import type { DisplayProfile } from './profiles'
import { assetUrl, isMachineKey, machineRoute } from './profiles'

export const reviewedOn = '2026-11-17'
const text = z.string().min(1)
const vector = z.tuple([z.number(),z.number(),z.number()])
const id = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
const source = z.strictObject({
  id: text, title: text, author: text, date: z.string().regex(/^\d{4}(-\d{2}){0,2}$/).nullable(),
  type: text, url: z.url({protocol:/^https$/}), relevance: text, reviewedOn:z.iso.date(),
})
const archiveSchema = z.strictObject({
  id, code:text, name:text, family:text, period:text, origin:text, aliases:z.array(text),
  kind:z.enum(['CAD reconstruction','Computational analogue','Publication','Presentation','Research lead','Project assembly','Community build','Educational hardware']),
  sourceIds:z.array(text), related:z.array(id), configuration:text, operation:text, gap:text,
  study:z.enum(['reactive','charge','resonators','magnetic','routing','markov','interlock','hydraulic','blink']).optional(),
  components:z.array(z.tuple([text,text,text])),
})
const asset = z.strictObject({name:text,path:z.string().regex(/^models\/archive\/[a-z0-9/_.-]+$/i)})
const placement = z.strictObject({
  key:text, partId:text, origin:vector, offset:vector, stage:z.number().int().min(0).max(8), rotation:z.number(),
})
const cad = z.strictObject({
  code:text, slug:id, revision:text, assetFolder:text, mesh:text, boundsMm:vector,
  baseMm:z.tuple([z.number(),z.number()]).optional(),shaftHeight:z.number(),
  rotating:z.array(text), inputParts:z.array(text), guard:z.array(text), defaultPart:text, assets:z.array(asset), placements:z.array(placement),
  parts:z.unknown(), assemblies:z.unknown(), connections:z.unknown(),
  service:z.record(text,z.strictObject({failureMode:text,tool:text,originSource:text.nullable(),envelopeMm:vector,classification:text})),
})

export const sources = z.array(source).parse(sourcesJson)
export const archive = z.array(archiveSchema).parse(recordsJson)
export type ArchiveEntry = z.infer<typeof archiveSchema>
export type ArchiveStudy = NonNullable<ArchiveEntry['study']>
export type ArchiveCad = z.infer<typeof cad>
export const sourceById = new Map(sources.map(item=>[item.id,item]))
export const archiveById = new Map(archive.map(item=>[item.id,item]))
export const archiveCad = z.record(id,cad).parse(cadJson)
export const contributeConfigurationUrl='https://github.com/RRG314/encabulator-lab/issues/new?template=encabulator-configuration.yml'

export function archiveHref(key?:string,view?:string,part?:string) {
  return ['#/archive',key,view,part].filter(Boolean).join('/')
}

export function workbenchHref(entry:ArchiveEntry) {
  return isMachineKey(entry.id) ? machineRoute(entry.id,'explorer') :
    archiveCad[entry.id] ? archiveHref(entry.id,'assembly') : undefined
}

export function archiveProfile(entry:ArchiveEntry, model:ArchiveCad):DisplayProfile {
  const [x,y]=model.boundsMm
  return {
    key:entry.id, code:entry.code, name:entry.name, description:entry.configuration,
    registry:registry(model.parts,model.assemblies,model.connections),
    placements:model.placements as Placement[], shaftHeight:model.shaftHeight,
    isoDirection:entry.id==='ge-1962'?[-.7,-1,.52]:undefined,
    shaftY:model.placements.find(row=>model.rotating.includes(row.partId))?.origin[1],
    baseMm:model.baseMm??[x,y], boundsMm:model.boundsMm, mesh:model.mesh, assetFolder:model.assetFolder,
    drawings:[model.assetFolder+'/drawings/assembled.svg',model.assetFolder+'/drawings/exploded.svg'],
    defaultPart:model.defaultPart, voltage:null, speed:null, guard:model.guard, rotating:model.rotating, inputParts:model.inputParts,
    motor:'', fan:'', harness:'', fanAt:[0,0,0], sensorAt:[0,0,0], wireAt:[0,0,0],
    service:model.service, href:path=>archiveHref(entry.id,path==='explorer'?'assembly':path),
  }
}

export function downloadUrl(file:z.infer<typeof asset>) { return assetUrl(file.path) }
