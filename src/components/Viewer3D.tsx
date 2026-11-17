import { Canvas, useFrame, useThree } from '@react-three/fiber'
import type { ThreeEvent } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { RefObject } from 'react'
import {
  ArrowHelper, Box3, DoubleSide, FrontSide, GridHelper, InstancedMesh, Matrix4, MeshStandardMaterial, Plane, Vector3,
} from 'three'
import type { OrthographicCamera, PerspectiveCamera } from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { partById } from '../data'
import { finishes, makeGeometries } from '../model/geometry'
import type { Finish, Vec3 } from '../model/geometry'
import { explodePosition, homeDirection, placements } from '../model/layout'
import type { Placement } from '../model/layout'
import { placementBounds, placementMatrix } from '../model/transforms'
import { shaftHeight } from '../model/layout'
import { disposeMeshes, loadCadMeshes } from '../model/cadMesh'

export type Preset = 'Iso' | 'Front' | 'Side' | 'Top'
export type Cutaway = 'Full' | 'Guard off' | 'Longitudinal' | 'Transverse'
export type Layer = 'Model' | 'Wiring' | 'Airflow' | 'Vibration'
export type ViewBookmark = { position: Vec3, target: Vec3, zoom: number, perspective: boolean }
export type ViewerProps = {
  selected: string
  onSelect: (id: string) => void
  visible: ReadonlySet<string>
  fraction: number
  isolate: boolean
  cutaway: Cutaway
  layer: Layer
  preset: Preset
  cameraTick: number
  snapshot: RefObject<ViewBookmark | null>
  recalled: ViewBookmark | null
  measure: ((position: Vec3) => void) | null
  wireframe: boolean
  opacity: number
  perspective: boolean
  labels: boolean
  reducedMotion: boolean
  compact: boolean
  onFailure: () => void
  dimensioning: boolean
  cadDetail: boolean
  onCadStatus: (status: 'schematic' | 'cad') => void
  speedRpm?: number
  motorTemperature?: number
  fanRunning?: boolean
  vibrationUm?: number
}

const presets: Record<Preset, Vec3> = {
  Iso: homeDirection, Front: [0, -1, 0], Side: [1, 0, 0], Top: [0, -0.0001, 1],
}

function CameraRig({ preset, fraction, visible, isolate, cameraTick, reducedMotion, geometries, scale, snapshot, recalled, perspective }: ViewerProps & {
  geometries: ReturnType<typeof makeGeometries>, scale: RefObject<HTMLDivElement | null>
}) {
  const { camera, gl, size, invalidate } = useThree()
  const controls = useMemo(() => {
    camera.up.set(0, 0, 1)
    const c = new OrbitControls(camera)
    c.enableDamping = !reducedMotion
    c.dampingFactor = 0.16
    c.minZoom = 0.22
    c.maxZoom = 12
    c.minDistance = 58
    c.maxDistance = 1900
    return c
  }, [camera, reducedMotion])
  useEffect(() => {
    const change = () => invalidate()
    gl.domElement.tabIndex = 0
    gl.domElement.setAttribute('aria-label','TE-01 3D model. Use arrow keys to pan, and Shift plus arrow keys to orbit.')
    controls.connect(gl.domElement)
    controls.listenToKeyEvents(gl.domElement)
    controls.addEventListener('change', change)
    return () => {
      controls.removeEventListener('change', change)
      controls.stopListenToKeyEvents()
      controls.disconnect()
    }
  }, [controls, gl, invalidate])
  const initial = useRef(true)
  useLayoutEffect(() => {
    initial.current = true
  }, [preset, cameraTick, isolate, visible, camera])
  useLayoutEffect(() => {
    const boxes = placements.filter(p => visible.has(p.partId)).map(p => placementBounds(p, fraction, geometries))
    const bounds = boxes.reduce((overall, box) => overall.union(box), new Box3())
    if (bounds.isEmpty()) return
    const target = bounds.getCenter(new Vector3())
    const oldDirection = camera.position.clone().sub(controls.target).normalize()
    const direction = initial.current ? new Vector3(...presets[preset]).normalize() : oldDirection
    const distance = Math.max(bounds.getSize(new Vector3()).length(), 45)
    const fitDepth = camera.type === 'PerspectiveCamera'
      ? distance * Math.max(1.45, size.height / size.width * 1.38)
      : 950
    controls.target.copy(target)
    camera.position.copy(target).addScaledVector(direction, fitDepth)
    camera.lookAt(target)
    camera.updateMatrixWorld()
    if (camera.type === 'OrthographicCamera') {
      const view = camera as OrthographicCamera
      const local = boxes.reduce((overall, box) => overall.union(box.applyMatrix4(camera.matrixWorldInverse)), new Box3())
      const center = local.getCenter(new Vector3())
      const shift = new Vector3(center.x, center.y, 0).applyMatrix4(camera.matrixWorld).sub(camera.position)
      controls.target.add(shift)
      camera.position.add(shift)
      const extent = local.getSize(new Vector3())
      const margin = size.width < 500 ? 0.87 : 0.83
      view.zoom = Math.min(size.width * margin / Math.max(extent.x, 26),
        size.height * margin / Math.max(extent.y, 26))
      view.updateProjectionMatrix()
    }
    if (recalled && initial.current && recalled.perspective === perspective) {
      camera.position.fromArray(recalled.position)
      controls.target.fromArray(recalled.target)
      if (camera.type === 'OrthographicCamera') (camera as OrthographicCamera).zoom = recalled.zoom
    }
    if (camera.type === 'OrthographicCamera') (camera as OrthographicCamera).updateProjectionMatrix()
    controls.update()
    initial.current = false
    invalidate()
  }, [camera, controls, fraction, geometries, invalidate, preset, size, visible, cameraTick, isolate, recalled, perspective])
  useFrame(() => {
    controls.update()
    snapshot.current = { position:camera.position.toArray(), target:controls.target.toArray(),
      zoom:camera.type === 'OrthographicCamera' ? (camera as OrthographicCamera).zoom : 1, perspective }
    if (scale.current) {
      const pxPerMm = camera.type === 'OrthographicCamera'
        ? (camera as OrthographicCamera).zoom
        : size.height / (2 * controls.getDistance() * Math.tan((camera as PerspectiveCamera).fov * Math.PI / 360))
      const mm = [100, 50, 20, 10, 5, 2, 1].find(unit => unit * pxPerMm <= 114) ?? 1
      scale.current.style.width = `${mm * pxPerMm}px`
      scale.current.textContent = `${mm} mm`
    }
  })
  return null
}

const sectionPlanes: Partial<Record<Cutaway, Plane>> = {
  Longitudinal: new Plane(new Vector3(0, 1, 0), 0),
  Transverse: new Plane(new Vector3(-1, 0, 0), 0),
}

function ModelBatch({ id, items, finish, geometry, options, onHover, angle }: {
  id: string, items: Placement[], finish: Finish, geometry: ReturnType<typeof makeGeometries>[string][number]['geometry'],
  options: ViewerProps, onHover: (id: string) => void, angle: RefObject<number>,
}) {
  const ref = useRef<InstancedMesh>(null)
  const plane = sectionPlanes[options.cutaway]
  const highlight = id === options.selected
  const finishStyle = finishes[finish]
  const glass = finish === 'glass'
  const opacity = glass ? finishes.glass.opacity : options.opacity
  const material = useMemo(() => {
    const mat = new MeshStandardMaterial({
      ...finishStyle, wireframe: options.wireframe, transparent: opacity < 1,
      opacity, depthWrite: opacity > 0.98, side: glass || plane ? DoubleSide : FrontSide,
      clippingPlanes: plane ? [plane] : [],
    })
    if (highlight && !glass) {
      mat.emissive.setHex(0xe99a48)
      mat.emissiveIntensity = finish === 'amber' ? 0.19 : 0.13
    }
    if (id === 'TE-003' && options.motorTemperature !== undefined && !highlight) {
      mat.emissive.setHex(0xff5b23)
      mat.emissiveIntensity = Math.max(0, Math.min(0.45, (options.motorTemperature - 30) / 150))
    }
    return mat
  }, [finish, finishStyle, glass, highlight, opacity, options.wireframe, plane, id, options.motorTemperature])
  useEffect(() => () => material.dispose(), [material])
  const matrices = useMemo(() => items.map(item => placementMatrix(item, options.fraction)), [items, options.fraction])
  const apply = (transform?: Matrix4) => {
    if (!ref.current) return
    matrices.forEach((matrix, i) => ref.current!.setMatrixAt(i, transform ? transform.clone().multiply(matrix) : matrix))
    ref.current.instanceMatrix.needsUpdate = true
  }
  useLayoutEffect(() => {
    if (!ref.current) return
    matrices.forEach((matrix, i) => ref.current!.setMatrixAt(i, matrix))
    ref.current.instanceMatrix.needsUpdate = true
    ref.current.computeBoundingSphere()
  }, [geometry, matrices])
  const spinning = !options.reducedMotion && Boolean(options.speedRpm) && options.fraction === 0
    && ['TE-005', 'TE-008', 'TE-009', 'TE-010', 'TE-030'].includes(id)
  useFrame(() => {
    if (spinning) apply(new Matrix4().makeTranslation(0, 0, shaftHeight)
      .multiply(new Matrix4().makeRotationX(angle.current))
      .multiply(new Matrix4().makeTranslation(0, 0, -shaftHeight)))
  })
  const select = (event: ThreeEvent<MouseEvent>) => {
    if (plane && plane.distanceToPoint(event.point) < 0) return
    event.stopPropagation()
    if (options.measure) options.measure(event.point.toArray())
    else options.onSelect(id)
  }
  return <instancedMesh ref={ref} args={[undefined, undefined, items.length]} geometry={geometry} material={material}
    frustumCulled={!spinning} renderOrder={glass ? 2 : 0}
    onClick={glass ? undefined : select}
    onPointerOver={glass ? undefined : event => {
      if (plane && plane.distanceToPoint(event.point) < 0) return
      event.stopPropagation()
      onHover(id)
    }}
    onPointerOut={glass ? undefined : () => onHover('')}
  />
}

function WorkshopGrid() {
  const grid = useMemo(() => {
    const floor = new GridHelper(820, 41, '#79664d', '#48505a')
    floor.rotateX(Math.PI / 2)
    floor.position.z = -16
    floor.material.transparent = true
    floor.material.opacity = 0.32
    return floor
  }, [])
  useEffect(() => () => grid.dispose(), [grid])
  return <primitive object={grid} />
}

function OverlayArrows({ layer, visible, fraction, fanRunning, dimensioning, vibrationUm }: ViewerProps) {
  const arrows = useMemo(() => {
    const make = (at: Vec3, along: Vec3, length: number, color: string, headLength = 7) =>
      new ArrowHelper(new Vector3(...along).normalize(), new Vector3(...at), length, color, headLength, 4)
    if (fraction > 0.01) return []
    if (dimensioning) return [
      make([-149,-110,-3],[1,0,0],298,'#e9a456'),
      make([149,-110,-3],[-1,0,0],298,'#e9a456'),
      make([162,-99,-3],[0,1,0],198,'#e9a456'),
      make([162,99,-3],[0,-1,0],198,'#e9a456'),
    ]
    if (layer === 'Airflow' && fanRunning !== false && visible.has('TE-012')) {
      return [-16,0,16].map(y => make([148,y,46],[-1,0,0],85,'#70bdc9'))
    }
    if (layer === 'Vibration' && visible.has('TE-017')) return [
      make([48,0,78],[0,0,1],43,'#83bfd5'), make([48,0,78],[0,-1,0], vibrationUm === undefined ? 44 : Math.max(8, Math.min(62, 8+vibrationUm)), '#e9a456'),
    ]
    if (layer === 'Wiring' && visible.has('TE-026')) return [
      make([-99,57,24],[0,-1,0.03],70,'#e9a456'),
      make([-67,-67,21],[1,0,0],59,'#83bfd5'),
    ]
    return []
  }, [dimensioning, fanRunning, fraction, layer, visible, vibrationUm])
  useEffect(() => () => arrows.forEach(arrow => arrow.dispose()), [arrows])
  return <>{arrows.map((arrow, i) => <primitive key={i} object={arrow} />)}</>
}

function Projection({ position, element }: { position: Vec3, element: RefObject<HTMLDivElement | null> }) {
  const vector = useMemo(() => new Vector3(), [])
  useFrame(({ camera, size }) => {
    if (!element.current) return
    vector.set(...position).project(camera)
    const x = (vector.x + 1) * size.width / 2
    const y = (1 - vector.y) * size.height / 2
    element.current.style.transform = `translate(${x}px, ${y}px)`
    element.current.hidden = Math.abs(vector.x) > 0.88 || Math.abs(vector.y) > 0.85
  })
  return null
}

function Scene({ props, callout, scale, onHover }: {
  props: ViewerProps, callout: RefObject<HTMLDivElement | null>, scale: RefObject<HTMLDivElement | null>,
  onHover: (id: string) => void,
}) {
  const schematic = useMemo(() => makeGeometries(props.compact), [props.compact])
  const [cad, setCad] = useState<ReturnType<typeof makeGeometries> | null>(null)
  const { cadDetail, onCadStatus } = props
  const geometry = cadDetail && cad ? cad : schematic
  useEffect(() => {
    if (!cadDetail) return
    let cancelled = false
    let loaded: typeof cad = null
    void loadCadMeshes().then(meshes => {
      if (cancelled) { disposeMeshes(meshes); return }
      loaded = meshes
      setCad(meshes)
      onCadStatus('cad')
    }).catch(() => onCadStatus('schematic'))
    return () => {
      cancelled = true
      if (loaded) disposeMeshes(loaded)
      setCad(null)
      onCadStatus('schematic')
    }
  }, [cadDetail, onCadStatus])
  const angle = useRef(0)
  const { gl, invalidate } = useThree()
  const { onFailure } = props
  useEffect(() => {
    gl.localClippingEnabled = true
    const failure = (event: Event) => { event.preventDefault(); onFailure() }
    gl.domElement.addEventListener('webglcontextlost', failure)
    return () => gl.domElement.removeEventListener('webglcontextlost', failure)
  }, [gl, onFailure])
  useEffect(() => () => disposeMeshes(schematic), [schematic])
  const batches = useMemo(() => {
    const items: Record<string, Placement[]> = {}
    for (const layout of placements) (items[layout.partId] ??= []).push(layout)
    return items
  }, [])
  const calloutPart = batches[props.selected]?.[0]
  const anchor = calloutPart && explodePosition(calloutPart, props.fraction)
  const target: Vec3 | undefined = anchor && [anchor[0], anchor[1], anchor[2] + (props.selected === 'TE-009' ? 18 : 0)]
  useFrame((_, delta) => {
    if (props.speedRpm && props.fraction === 0 && !props.reducedMotion) {
      angle.current = (angle.current + props.speedRpm * (Math.PI / 30) * Math.min(delta, 0.05)) % (2 * Math.PI)
      invalidate()
    }
  })
  return <>
    <hemisphereLight args={['#eef5ff', '#707078', 2.15]} />
    <directionalLight position={[-160,-220,400]} intensity={3.2} color="#fff4e7" />
    <directionalLight position={[210,130,240]} intensity={2.1} color="#badbff" />
    <directionalLight position={[200,-320,15]} intensity={0.65} color="#e2e3e8" />
    <WorkshopGrid />
    <CameraRig {...props} geometries={geometry} scale={scale} />
    <OverlayArrows {...props} />
    {Object.entries(batches).flatMap(([id, items]) => {
      if (!props.visible.has(id) || (props.cutaway === 'Guard off' && id === 'TE-014')) return []
      return geometry[id].map(piece => <ModelBatch key={`${id}:${piece.finish}`} id={id} items={items}
        angle={angle} {...piece} options={props} onHover={onHover} />)
    })}
    {props.labels && target && props.visible.has(props.selected) &&
      !(props.selected === 'TE-014' && props.cutaway === 'Guard off') && <Projection position={target} element={callout} />}
  </>
}

export default function Viewer3D(props: ViewerProps) {
  const callout = useRef<HTMLDivElement>(null)
  const scale = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState('')
  const selected = partById.get(props.selected)
  const highlighted = partById.get(hover)
  return <>
    <Canvas key={String(props.perspective)} orthographic={!props.perspective}
      camera={{ position: [400,-620,400], near: 0.1, far: 3800, ...(props.perspective ? { fov: 38 } : {}) }}
      dpr={[1, props.compact ? 1.25 : 1.7]} frameloop="demand"
      gl={{ antialias: !props.compact, alpha: true }}
      fallback={<p>WebGL rendering is unavailable.</p>}>
      <Scene props={props} callout={callout} scale={scale} onHover={setHover} />
    </Canvas>
    {props.labels && selected && props.visible.has(selected.id) &&
      !(selected.id === 'TE-014' && props.cutaway === 'Guard off') &&
      <div className="model-callout" ref={callout}><i /><span>{selected.id} <b>{selected.name}</b></span></div>}
    {highlighted && <div className="model-tooltip" role="status">{highlighted.id} · {highlighted.name}</div>}
    <div className="scale-rule" ref={scale}>50 mm</div>
  </>
}
