import { Box3, Euler, Matrix4, Quaternion, Vector3 } from 'three'
import type { Vec3 } from './geometry'

export const shaftHeight = 58
export const journalStations = [-48, 48] as const
export const homeTarget: Vec3 = [0, 0, 27]
export const homeDirection: Vec3 = [0.57, -1, 0.63]

export interface Placement {
  key: string
  partId: string
  origin: Vec3
  offset: Vec3
  stage: number
  rotation: number
}

const placement = (partId: string, origin: Vec3, endpoint: Vec3, stage: number,
  index = 0, rotation = 0): Placement => ({
  key: `${partId}:${index + 1}`, partId, origin,
  offset: [endpoint[0]-origin[0], endpoint[1]-origin[1], endpoint[2]-origin[2]], stage, rotation,
})

const vanes = Array.from({ length: 6 }, (_, index) => {
  const angle = index * Math.PI / 3
  return placement('TE-009', [0,-Math.sin(angle)*16,shaftHeight+Math.cos(angle)*16],
    [0,-Math.sin(angle)*113,149+Math.cos(angle)*101], 4, index, angle)
})

const fasteners = [
  ...[-1,1].flatMap(x => [-1,1].map(y => [x*134,y*84,-1] satisfies Vec3)),
  ...journalStations.flatMap(x => [-1,1].map(y => [x, y*16, 4] satisfies Vec3)),
  ...[-1,1].flatMap(x => [-1,1].map(y => [-111+x*19,y*17,28] satisfies Vec3)),
  ...[-1,1].flatMap(x => [-1,1].map(y => [x*32,y*49,5] satisfies Vec3)),
  ...[-1,1].flatMap(x => [-1,1].map(y => [-39+x*39,-70+y*21,16] satisfies Vec3)),
].map((origin, i) => placement('TE-029', origin, [-135+i%10*29, -145-Math.floor(i/10)*13, -43], 7, i))

export const placements: Placement[] = [
  placement('TE-001',[0,0,-3],[0,0,-58],8),
  ...[-1,1].flatMap(x => [-1,1].map((y,i) =>
    placement('TE-002',[x*134,y*84,-10.5],[x*145,y*94,-82],8,(x+1)+i))),
  placement('TE-003',[-110,0,shaftHeight],[-207,0,69],7),
  placement('TE-004',[-55,-70,6.5],[-75,-169,59],2),
  placement('TE-005',[6,0,shaftHeight],[0,0,69],5),
  ...journalStations.map((x,i) => placement('TE-006',[x,0,shaftHeight],[x*2.05,0,105],6,i)),
  ...journalStations.map((x,i) => placement('TE-007',[x,0,shaftHeight],[x*2.45,0,54],6,i)),
  placement('TE-008',[0,0,shaftHeight],[0,0,149],4),
  ...vanes,
  placement('TE-010',[24,0,shaftHeight],[46,0,148],5),
  placement('TE-011',[-110,0,3.5],[-208,0,-13],8),
  placement('TE-012',[110,0,44],[224,-2,135],1),
  placement('TE-013',[85,0,44],[163,0,114],1),
  placement('TE-014',[0,0,shaftHeight],[0,0,345],0),
  placement('TE-015',[0,0,shaftHeight],[0,113,259],3),
  placement('TE-016',[-26,-70,6.5],[-42,-170,59],2),
  placement('TE-017',[48,0,76],[122,-32,116],2),
  placement('TE-018',[27,-14,shaftHeight],[70,-50,111],3),
  placement('TE-019',[-109,-7,78],[-205,-36,105],2,0),
  placement('TE-019',[48,11,74],[125,31,96],2,1),
  placement('TE-020',[-3,-70,6.5],[-14,-170,59],2),
  placement('TE-021',[48,-78,18],[54,-165,95],2),
  placement('TE-022',[-99,66,12],[-135,149,58],2),
  placement('TE-023',[-50,72,11],[-87,153,56],2),
  placement('TE-024',[-33,-51,68],[-54,-46,254],0),
  placement('TE-025',[-39,-70,6],[-40,-151,18],2),
  placement('TE-026',[0,0,0],[0,265,90],2),
  placement('TE-027',[-26,-77,8.2],[14,-170,60],2),
  placement('TE-028',[63,0,shaftHeight],[79,0,144],5),
  ...fasteners,
  placement('TE-030',[-71,0,shaftHeight],[-131,0,105],7),
]

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

export function placementMatrix(placement: Placement, fraction: number, target = new Matrix4()) {
  const rotation = new Quaternion().setFromEuler(new Euler(placement.rotation, 0, 0))
  return target.compose(new Vector3(...explodePosition(placement, fraction)), rotation, new Vector3(1, 1, 1))
}

export function placementBounds(
  placement: Placement, fraction: number,
  geometries: ReturnType<typeof import('./geometry').makeGeometries>,
) {
  const bounds = new Box3()
  const matrix = placementMatrix(placement, fraction)
  for (const piece of geometries[placement.partId]) bounds.union(piece.geometry.boundingBox!.clone().applyMatrix4(matrix))
  return bounds
}
