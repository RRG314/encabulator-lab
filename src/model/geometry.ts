import {
  BoxGeometry, CylinderGeometry, ExtrudeGeometry, Shape, Path, Vector3, CatmullRomCurve3,
  TubeGeometry, TorusGeometry, LatheGeometry, Vector2,
} from 'three'
import type { BufferGeometry } from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

export type Vec3 = [number, number, number]
export type Finish = keyof typeof finishes

export const finishes = {
  plate: { color: '#76818a', metalness: 0.65, roughness: 0.39 },
  steel: { color: '#c0c8cb', metalness: 0.67, roughness: 0.27 },
  bright: { color: '#e3e5df', metalness: 0.47, roughness: 0.33 },
  cast: { color: '#424d56', metalness: 0.48, roughness: 0.57 },
  frame: { color: '#303942', metalness: 0.47, roughness: 0.45 },
  black: { color: '#242b32', metalness: 0.17, roughness: 0.66 },
  rubber: { color: '#161b20', metalness: 0.02, roughness: 0.83 },
  glass: { color: '#b7c6d1', metalness: 0.14, roughness: 0.23, transparent: true, opacity: 0.12, depthWrite: false },
  board: { color: '#3f665b', metalness: 0.12, roughness: 0.63 },
  gold: { color: '#bd9863', metalness: 0.57, roughness: 0.33 },
  amber: { color: '#eaa554', metalness: 0.37, roughness: 0.34 },
  red: { color: '#ce483c', metalness: 0.16, roughness: 0.41 },
  blue: { color: '#457e93', metalness: 0.2, roughness: 0.44 },
  sensor: { color: '#73bab9', metalness: 0.23, roughness: 0.43 },
} as const

type Piece = [Finish, BufferGeometry]

function at(geometry: BufferGeometry, position: Vec3) {
  return geometry.translate(...position)
}
function box(finish: Finish, size: Vec3, position: Vec3 = [0, 0, 0]): Piece {
  return [finish, at(new BoxGeometry(...size), position)]
}
function cylinder(finish: Finish, radius: number, length: number, axis: 'x' | 'z',
  position: Vec3 = [0, 0, 0], segments = 32, top = radius): Piece {
  const shape = new CylinderGeometry(top, radius, length, segments)
  if (axis === 'x') shape.rotateZ(-Math.PI / 2)
  else shape.rotateX(Math.PI / 2)
  return [finish, at(shape, position)]
}
function polygon(points: [number, number][]) {
  const shape = new Shape(points.map(point => new Vector2(...point)))
  shape.closePath()
  return shape
}
function circle(x: number, y: number, radius: number) {
  return new Path().absarc(x, y, radius, 0, 2 * Math.PI, true)
}
function extrude(shape: Shape, depth: number, bevel = 0, curves = 12) {
  return new ExtrudeGeometry(shape, {
    depth, steps: 1, curveSegments: curves, bevelEnabled: bevel > 0,
    bevelThickness: bevel, bevelSize: bevel, bevelSegments: 1,
  }).translate(0, 0, -depth / 2)
}
function ring(finish: Finish, outer: number, inner: number, length: number,
  position: Vec3 = [0, 0, 0], axis: 'x' | 'z' = 'x'): Piece {
  const shape = new Shape()
  shape.absarc(0, 0, outer, 0, 2 * Math.PI)
  shape.holes.push(circle(0, 0, inner))
  const solid = extrude(shape, length, 0, 20)
  if (axis === 'x') solid.rotateY(Math.PI / 2)
  return [finish, at(solid, position)]
}
function tube(finish: Finish, radius: number, points: Vec3[], segments = 20): Piece {
  const curve = new CatmullRomCurve3(points.map(point => new Vector3(...point)))
  return [finish, new TubeGeometry(curve, segments, radius, 6)]
}
function flange(finish: Finish, width: number, height: number, depth: number, bore: number,
  position: Vec3, drill = false): Piece {
  const a = width / 2
  const b = height / 2
  const shape = polygon([[-a, -b+3], [-a+3, -b], [a-3, -b], [a, -b+3], [a, b-3], [a-3, b], [-a+3, b], [-a, b-3]])
  shape.holes.push(circle(0, 0, bore))
  if (drill) for (const y of [-1, 1]) for (const z of [-1, 1]) shape.holes.push(circle(y*(b-4), z*(a-4), 1.4))
  return [finish, at(extrude(shape, depth, 0.4).rotateY(Math.PI / 2), position)]
}

function baseplate(): Piece[] {
  const outline = polygon([[-150,-94],[-144,-100],[144,-100],[150,-94],[150,94],[144,100],[-144,100],[-150,94]])
  for (const x of [-134, 134]) for (const y of [-84, 84]) outline.holes.push(circle(x, y, 3.1))
  return [
    ['plate', extrude(outline, 5.2, 0.4)],
    ...[-1, 1].flatMap(side => [
      box('black', [248, 0.6, 1.2], [0, side * 100.45, 0.5]),
      box('amber', [22, 0.8, 1.4], [side * 124, -100.5, -1]),
    ]),
  ]
}

function motor(): Piece[] {
  const shell = new LatheGeometry([
    [0, -29], [15, -29], [18, -26], [19.3, -20], [19.3, 20], [18.7, 25], [15, 29], [0, 29],
  ].map(point => new Vector2(...point)), 36).rotateZ(-Math.PI / 2)
  return [
    ['cast', shell], cylinder('plate', 17.5, 3, 'x', [25.5, 0, 0]),
    cylinder('steel', 4, 12, 'x', [30, 0, 0]), cylinder('black', 13, 1, 'x', [-29.5, 0, 0]),
    ...Array.from({ length: 12 }, (_, index) => {
      const angle = index * Math.PI / 6
      const fin = new BoxGeometry(37, 2.8, 4.7).translate(0, 0, 20.3).rotateX(angle)
      return ['frame', fin] satisfies Piece
    }),
    ...[-1, 1].flatMap(side => [
      box('cast', [43, 9, 7], [0, side * 14.5, -20]),
      box('plate', [42, 13, 3], [0, side * 15, -24]),
    ]),
    box('black', [16, 11, 8], [-11, -11, 17.5]),
    box('gold', [14, 8, 0.8], [4, -3, 19.4]),
  ]
}

function bearing(): Piece[] {
  return [
    ring('steel', 11, 9.25, 7), ring('steel', 5.7, 4, 7),
    ...[-3.2, 3.2].map(x => ring('rubber', 9.3, 5.65, 0.4, [x, 0, 0])),
  ]
}

function housing(): Piece[] {
  return [
    flange('cast', 34, 33, 11.5, 11.05, [0, 0, 0], true),
    box('cast', [13, 22, 34], [0, 0, -32]),
    box('plate', [24, 43, 4], [0, 0, -56]),
    ...[-1, 1].map(side => box('cast', [13, 6, 30], [0, side * 12, -32])),
  ]
}

function hub(): Piece[] {
  return [
    ring('steel', 16, 4, 38),
    ...[-19.5, 19.5].map(x => ring('plate', 18, 4, 2.5, [x, 0, 0])),
    ...Array.from({ length: 6 }, (_, i) => [
      'black', new BoxGeometry(32, 6.3, 4).translate(0, 0, 15).rotateX(i * Math.PI / 3),
    ] satisfies Piece),
  ]
}

function vane(): Piece[] {
  // The extrusion is radial in local +Z. The same mold is indexed six times about +X.
  const aerofoil = polygon([[-18,-3],[-13,-4],[0,-2.5],[12,1],[18,4],[12,4.7],[-1,2],[-16,0]])
  return [
    ['amber', extrude(aerofoil, 24, 0.65).translate(0, 0, 14)],
    box('cast', [27, 6, 5], [0, 0, 1.5]),
    ...[-7, 7].map(x => cylinder('bright', 1.5, 0.7, 'z', [x, 0, 4.3], 6)),
  ]
}

function fan(): Piece[] {
  return [
    flange('frame', 53, 53, 14, 22, [0,0,0], true),
    cylinder('cast', 7.5, 10, 'x'), cylinder('steel', 4.5, 0.6, 'x', [5.2,0,0]),
    ...Array.from({ length: 7 }, (_, i) => {
      const blade = polygon([[7,-2],[11,-5],[20,-4],[21,0],[17,5],[9,3]])
      return ['plate', extrude(blade, 1.6, 0.4).rotateY(Math.PI / 2).rotateX(i * 2*Math.PI / 7)] satisfies Piece
    }),
    ...[9, 14, 19, 23].map(radius => ['steel', new TorusGeometry(radius, 0.45, 5, 36).rotateY(Math.PI/2).translate(8,0,0)] satisfies Piece),
    ...[0, 1, 2].map(i => ['cast', new BoxGeometry(0.8, 47, 0.8).rotateX(i * Math.PI/3).translate(8.3,0,0)] satisfies Piece),
  ]
}

function duct(): Piece[] {
  return [
    flange('cast', 50, 49, 5, 22, [12.5,0,0], true),
    ['frame', new LatheGeometry([[21,-13],[23,-13],[24,13],[22,13],[21,-13]].map(point => new Vector2(...point)), 32).rotateZ(-Math.PI/2)],
    ring('plate', 24, 21, 2, [-13,0,0]),
    ...[-15,-10,-5,0,5,10,15].map(y => box('black', [1.2, 0.9, 39], [11,y,0])),
  ]
}

function guard(): Piece[] {
  const frame: Piece[] = []
  for (const x of [-35, 35]) {
    frame.push(flange('plate', 106, 106, 3, 49, [x,0,0]))
    for (const y of [-49, 49]) frame.push(box('frame', [8,9,6], [x,y,-55]))
  }
  for (const y of [-50, 50]) {
    for (const z of [-50, 50]) frame.push(box('cast', [74,4,4], [0,y,z]))
    frame.push(box('glass', [67,1.3,96], [0,y,0]))
  }
  frame.push(box('glass', [67,95,1.4], [0,0,51]))
  frame.push(box('frame', [68,98,1.8], [0,0,-51]))
  frame.push(box('amber', [51,2,1], [0,-50,53]), box('black', [34,7,1], [0,-43,53]))
  for (const x of [-25, -15, -5, 5, 15, 25]) {
    frame.push(box('amber', [4.2, 1.6, 2.1], [x,-53,48]))
  }
  return frame
}

function spiral(): Piece[] {
  const points = Array.from({ length: 30 }, (_, i): Vec3 => {
    const theta = i * Math.PI * 1.6 / 29
    const radius = 45 * Math.exp(0.014 * theta)
    return [29 - i * 0.13, radius * Math.cos(theta), radius * Math.sin(theta)]
  })
  return [tube('blue', 0.85, points, 34)]
}

function pcb(width: number, height: number, detail = 4): Piece[] {
  return [
    box('board', [width,height,1.8]),
    box('black', [width*0.28,height*0.38,1.8], [0,0,1.7]),
    box('steel', [width*0.24,height*0.35,0.45], [width*0.25,0,1.3]),
    ...Array.from({ length: detail }, (_, i) => {
      const x = (i + 0.55 - detail/2) * width / (detail+1)
      return box('gold', [1.1,1.6,0.5], [x, -height*0.38, 1.2])
    }),
    ...[-1,1].flatMap(side => [
      box('bright', [5,3,3.5], [side*(width/2-3),height*0.3,2.5]),
      box('black', [2.6,2,1.2], [side*(width/2-2),-height*0.12,1.4]),
    ]),
  ]
}

function enclosure(): Piece[] {
  return [
    box('frame', [87,49,3], [0,0,-3]),
    box('plate', [87,2.5,14], [0,-24,2]),
    box('cast', [87,2,16], [0,24,3]),
    ...[-1,1].map(side => box('cast',[2,47,13],[side*42.5,0,2])),
    box('glass', [84,45,1.1], [0,0,17.5]),
    box('frame', [87,8,2], [0,20.5,17.5]),
    ...Array.from({ length: 11 }, (_, i) => box('plate', [3.2,1,0.65], [i*6.8-34,-25.5,4.5])),
  ]
}

function harness(): Piece[] {
  return [
    tube('black', 2.25, [[-73,-68,9],[-86,-66,9],[-96,-52,9],[-105,-27,10],[-123,-22,29],[-123,-9,78]]),
    tube('gold', 0.85, [[-74,-65,11],[-86,-64,11],[-96,-50,11],[-103,-26,12],[-121,-20,30],[-121,-9,78]]),
    tube('blue', 1.35, [[-10,-68,10],[22,-65,9],[44,-53,10],[50,-27,15],[52,-14,45],[48,-11,66]]),
    tube('black', 1.45, [[-37,-64,7],[-25,-58,8],[-13,-58,8],[24,-65,8],[84,-67,12],[116,-48,11],[116,-28,29]]),
    tube('amber', 0.9, [[-120,-72,7],[-130,-59,9],[-133,-19,9],[-134,34,9],[-129,65,10]]),
    box('bright',[7,5,4],[-73,-68,9]), box('bright',[6,5,4],[48,-11,66]),
  ]
}

export function makeGeometries(lowDetail = false) {
  const sources: Record<string, Piece[]> = {
    'TE-001': baseplate(),
    'TE-002': [cylinder('rubber', 10, 9, 'z', [0,0,0], 24, 8.5), cylinder('steel', 5, 2, 'z',[0,0,5])],
    'TE-003': motor(),
    'TE-004': [...pcb(22, 27, 7), box('plate',[15,16,3],[0,0,2.8]), ...[-5,-2.5,0,2.5,5].map(x => box('black',[1,15,3.5],[x,0,5.5]))],
    'TE-005': [cylinder('steel', 4, 136, 'x'), cylinder('bright', 4.8, 34, 'x', [-6,0,0])],
    'TE-006': bearing(),
    'TE-007': housing(),
    'TE-008': hub(),
    'TE-009': vane(),
    'TE-010': [ring('cast', 11, 4, 4), ring('steel', 9, 4, 0.7, [2.4,0,0])],
    'TE-011': [
      box('plate',[59,45,3],[0,0,-2]), box('cast',[53,40,4],[0,0,25.5]),
      ...[-1,1].flatMap(x => [-1,1].flatMap(y => [
        cylinder('rubber', 7.2, 23, 'z',[x*21,y*14,11]), cylinder('steel',5.5,1.5,'z',[x*21,y*14,1]),
      ])),
    ],
    'TE-012': fan(),
    'TE-013': duct(),
    'TE-014': guard(),
    'TE-015': spiral(),
    'TE-016': pcb(21, 24, 8),
    'TE-017': pcb(8, 8, 3),
    'TE-018': [
      box('frame',[11,8,11],[0,0,-3]),
      box('sensor',[6,3,4],[0,4.5,0]),
      ring('steel',6,4,3,[0,14,0]), box('bright',[2,2,2],[1,10,4.8]),
    ],
    'TE-019': [cylinder('gold',2.4,4.5,'z'), cylinder('rubber',1.35,3,'z',[0,0,3]), box('blue',[6,2,2],[3,0,3.5])],
    'TE-020': [...pcb(15, 19, 4),box('blue',[5,17,5],[-4.5,0,3]),box('steel',[3,10,2],[3,0,3])],
    'TE-021': [
      box('frame',[25,21,16],[0,0,-10]), cylinder('amber',10,2,'z',[0,0,-1]),
      cylinder('red',8.4,5,'z',[0,0,2.5],32,9.4),
    ],
    'TE-022': [
      box('cast',[54,32,20]), box('plate',[55,32.5,2],[0,0,10.5]), box('black',[9,23,8],[23,0,4]),
      ...Array.from({ length: 8 }, (_, i) => box('frame',[2,21,0.5],[i*5.2-23,0,11.6])),
      ...[-6,0,6].map(y => cylinder('gold',1.7,1,'z',[24,y,8.5],8)),
    ],
    'TE-023': [box('frame',[19,19,16],[0,0,-3]),box('blue',[10,10,1.7],[0,0,5.4]),box('steel',[4,8,3],[0,0,7.2])],
    'TE-024': [box('frame',[13,7,8]),box('amber',[5,4,3],[0,-4.5,2.5]),box('steel',[2,8,1],[4,0,4.6])],
    'TE-025': enclosure(),
    'TE-026': harness(),
    'TE-027': [box('blue',[7,7,1.4]),box('black',[5.2,5.2,1],[0,0,1]), ...[-1,1].map(x => box('gold',[0.6,6.2,0.4],[x*3.5,0,0.6]))],
    'TE-028': [ring('blue',9,4,8),ring('steel',10,4,1.2,[3.5,0,0])],
    'TE-029': [cylinder('steel',2.6,2.3,'z',[0,0,1.5],6),cylinder('black',1,0.3,'z',[0,0,2.68],6),cylinder('steel',1.3,5,'z',[0,0,-2],12)],
    'TE-030': [
      ring('steel',10,4,8,[-6,0,0]),ring('plate',10,4,8,[6,0,0]),ring('amber',9.6,4,4),
      box('black',[3,3,0.6],[-6.5,0,10]),box('black',[3,3,0.6],[5.5,0,10]),
    ],
  }

  // Each finish becomes a single draw call per component, including instanced copies.
  return Object.fromEntries(Object.entries(sources).map(([id, pieces]) => {
    const buffers = new Map<Finish, BufferGeometry[]>()
    for (const [finish, geometry] of pieces) {
      // Small contacts, fins and grooves soften at the compact viewport level of detail.
      geometry.computeBoundingBox()
      const size = geometry.boundingBox!.getSize(new Vector3())
      if (lowDetail && pieces.length > 5 && Math.max(size.x, size.y, size.z) < 3.3) {
        geometry.dispose()
        continue
      }
      const solid = geometry.index ? geometry.toNonIndexed() : geometry
      if (solid !== geometry) geometry.dispose()
      buffers.set(finish, [...(buffers.get(finish) ?? []), solid])
    }
    return [id, Array.from(buffers, ([finish, geometries]) => {
      const geometry = mergeGeometries(geometries)
      for (const source of geometries) source.dispose()
      geometry.computeBoundingBox()
      return { finish, geometry }
    })]
  }))
}
