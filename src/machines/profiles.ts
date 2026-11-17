import { registry, teRegistry } from '../data'
import { placements, shaftHeight } from '../model/layout'
import type { Placement } from '../model/layout'
import type { Vec3 } from '../model/geometry'
import type { Part } from '../schemas/part'
import reParts from '../../data/re01/parts.json'
import reAssemblies from '../../data/re01/assemblies.json'
import reConnections from '../../data/re01/connections.json'
import reLayout from '../../data/re01/model-layout.json'
import reService from '../../data/re01/service.json'
import meParts from '../../data/me01/parts.json'
import meAssemblies from '../../data/me01/assemblies.json'
import meConnections from '../../data/me01/connections.json'
import meLayout from '../../data/me01/model-layout.json'
import meService from '../../data/me01/service.json'
import teService from '../../data/service.json'
import teEnvelopes from '../../data/te01-envelopes.json'

export type MachineKey = 'te01' | 're01' | 'me01'
export interface ServiceRecord {
  failureMode: string
  tool: string
  source?: string | null
  originSource?: string | null
  massBasis?: string
  envelopeMm?: number[]
  classification?: string
  variables?: string
  centerMm?: number[]
  centroidAxisInertiaKgM2?: number[]
}
export type MachineProfile = {
  key: MachineKey, code: string, name: string, configuration?:string, description?:string, registry: ReturnType<typeof registry>,
  placements: Placement[], shaftHeight: number, baseMm: [number, number], boundsMm: [number, number, number],
  mesh: string, assetFolder: string, defaultPart: string, voltage: number, speed: [number, number],
  guard: readonly string[], rotating: readonly string[], motor: string, fan: string, harness: string,
  fanAt: Vec3, sensorAt: Vec3, wireAt: Vec3, service: Record<string, ServiceRecord>,
}
export type DisplayProfile = Omit<MachineProfile,'key'|'speed'|'voltage'> & {
  key:string, speed:MachineProfile['speed'] | null, voltage:number | null,
  shaftY?:number, inputParts?:string[], isoDirection?:Vec3, href:(path:string)=>string,
}
const candidateTools: Record<string, string> = {
  'TE-001': '5 mm hex key · candidate M6 attachment', 'TE-002': '13 mm spanner · candidate foot locknut',
  'TE-003': '4 mm hex key · candidate motor mount', 'TE-004': 'PH2 screwdriver · candidate board fixture',
  'TE-005': 'Dial indicator · 0.01 mm graduation candidate', 'TE-006': 'Bearing puller · candidate Ø22 mm envelope',
  'TE-007': '4 mm hex key · candidate pedestal hardware', 'TE-008': '3 mm hex key · candidate hub clamp',
  'TE-009': '3 mm hex key · candidate vane keeper', 'TE-010': 'Snap-ring pliers · retainer selection pending',
  'TE-011': '4 mm hex key · candidate isolation mount', 'TE-012': 'PH2 screwdriver · candidate fan mount',
  'TE-013': 'PH2 screwdriver · candidate filter latch', 'TE-014': '4 mm hex key · candidate guard hardware',
  'TE-015': '3 mm hex key · candidate insert mount', 'TE-016': 'PH1 screwdriver · candidate board mount',
  'TE-017': '2.5 mm hex key · candidate instrument mount', 'TE-018': 'Feeler gauge · pickup gap pending',
  'TE-019': 'Reference thermometer · calibration range pending', 'TE-020': 'DC multimeter · approved range pending',
  'TE-021': 'Panel locknut spanner · actuator selection pending', 'TE-022': 'Insulated terminal driver · size pending',
  'TE-023': 'Insulated terminal driver · fuse carrier selection pending', 'TE-024': '2.5 mm hex key · candidate switch mount',
  'TE-025': 'PH2 screwdriver · candidate cover', 'TE-026': 'Multimeter · continuity function',
  'TE-027': 'Software trace viewer · version matched to firmware', 'TE-028': 'Reference torque fixture · range pending',
  'TE-029': '4 mm hex key · representative socket head', 'TE-030': '3 mm hex key · candidate clamp screw',
}

export const machines: Record<MachineKey, MachineProfile> = {
  te01: {key:'te01',code:'TE-01',name:'Turbo Encabulator',
    description:'Bench-scale engineering design with an instrumented six-vane rotor, independent cooling, and phase estimation.',
    registry:teRegistry,placements,shaftHeight,
    baseMm:[300,200],boundsMm:[300,200,200],mesh:'models/te01.glb',assetFolder:'models',defaultPart:'TE-009',voltage:24,speed:[300,3000],
    guard:['TE-014'],rotating:['TE-005','TE-008','TE-009','TE-010','TE-030'],motor:'TE-003',fan:'TE-012',harness:'TE-026',
    fanAt:[148,0,44],sensorAt:[48,0,78],wireAt:[-99,57,24],
    service:Object.fromEntries(Object.entries(teService).map(([id,value])=>[id,{...value,tool:candidateTools[id],envelopeMm:teEnvelopes[id as keyof typeof teEnvelopes]}]))},
  re01: {key:'re01',code:'RE-01',name:'Retro Encabulator',registry:registry(reParts,reAssemblies,reConnections),
    placements:reLayout.placements as Placement[],shaftHeight:reLayout.shaftHeight,baseMm:[488,350],boundsMm:[488,350,208],
    mesh:'models/re01/re01.glb',assetFolder:'models/re01',defaultPart:'RE-008',voltage:48,speed:[300,2100],
    guard:['RE-017','RE-018','RE-042','RE-048'],
    rotating:['RE-005','RE-006','RE-007','RE-008','RE-009','RE-022','RE-023','RE-024','RE-025'],
    motor:'RE-021',fan:'RE-013',harness:'RE-046',fanAt:[205,0,84],sensorAt:[82,15,107],wireAt:[-150,118,55],service:reService},
  me01: {key:'me01',code:'ME-01',name:'Metachronic Encabulator',configuration:'Polychronous Differential Synchronization',registry:registry(meParts,meAssemblies,meConnections),
    placements:meLayout.placements as Placement[],shaftHeight:meLayout.shaftHeight,baseMm:[620,412],boundsMm:[620,412,218],
    mesh:'models/me01/me01.glb',assetFolder:'models/me01',defaultPart:'ME-013',voltage:36,speed:[300,2200],
    guard:['ME-004','ME-031'],rotating:['ME-005','ME-012','ME-013','ME-014'],motor:'ME-009',fan:'ME-018',harness:'ME-029',
    fanAt:[270,0,108],sensorAt:[151,0,151],wireAt:[-235,145,60],service:meService},
}

export function machineRoute(model: MachineKey, path: string) {
  return model === 'te01' ? `#/${path}` : `#/${model}/${path}`
}
export function isMachineKey(value:string):value is MachineKey {
  return Object.hasOwn(machines,value)
}
export function readRoute(hash: string) {
  const segments=hash.replace(/^#\/?/, '').split('/')
  const model: MachineKey = segments[0] === 're01' ? 're01' : segments[0]==='me01'?'me01':'te01'
  if (segments[0] === model) segments.shift()
  const [page,param,view,detail]=segments
  return { model, page:page || 'explorer', param,view,detail }
}
export function assetUrl(file: string) { return `${import.meta.env.BASE_URL}${file}` }
export const dimensionText = (part: Part, service?:ServiceRecord) => part.dimensionsMm
  ? Object.entries(part.dimensionsMm).slice(0,3).map(([name,value])=>
    `${name.replace(/[A-Z]/g,ch=>` ${ch.toLowerCase()}`)} ${Number(value.toPrecision(4))} mm`).join(' · ')
  : service?.envelopeMm?.length ? `${service.envelopeMm.map(value=>Number(value.toPrecision(4))).join(' × ')} mm · CAD X/Y/Z` : 'Pending design selection'
