import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Box, Camera, Crosshair, Eye, Grid2X2, Layers, Maximize, Move, Ruler, ScanLine, Settings2 } from 'lucide-react'
import { assemblies, partById, parts } from '../data'
import type { AssemblyId } from '../schemas/part'
import { PartsTree } from '../components/PartsTree'
import { PartInspector } from '../components/PartInspector'
import { ExplodeSlider } from '../components/ExplodeSlider'
import { GraphicsBoundary, supportsWebGL, ViewerFallback } from '../components/ViewerFallback'
import type { Cutaway, Layer, Preset, ViewBookmark, ViewerProps } from '../components/Viewer3D'

const Viewer3D = lazy(() => import('../components/Viewer3D'))
type Point = [number,number,number]
const layers: Layer[] = ['Model', 'Wiring', 'Airflow', 'Vibration']
const presets: Preset[] = ['Iso', 'Front', 'Side', 'Top']

function useMedia(query: string) {
  const media = useMemo(() => matchMedia(query), [query])
  const [matches, setMatches] = useState(media.matches)
  useEffect(() => {
    const update = () => setMatches(media.matches)
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [media])
  return matches
}

export function Explorer({ selected, onSelect, telemetry }: { selected: string, onSelect: (id: string) => void,
  telemetry?: Pick<ViewerProps, 'speedRpm' | 'motorTemperature' | 'fanRunning' | 'vibrationUm'> }) {
  const [amount, setAmount] = useState(0)
  const [layer, setLayer] = useState<Layer>('Model')
  const [preset, setPreset] = useState<Preset>('Iso')
  const snapshot = useRef<ViewBookmark>(null)
  const [recalled, setRecalled] = useState<ViewBookmark | null>(null)
  const [cameraTick, setCameraTick] = useState(0)
  const [cutaway, setCutaway] = useState<Cutaway>('Full')
  const [wireframe, setWireframe] = useState(false)
  const [opacity, setOpacity] = useState(1)
  const [perspective, setPerspective] = useState(false)
  const [labels, setLabels] = useState(true)
  const [dimensioning, setDimensioning] = useState(false)
  const [measuring, setMeasuring] = useState(false)
  const [points, setPoints] = useState<Point[]>([])
  const [options, showOptions] = useState(false)
  const [assembly, setAssembly] = useState<AssemblyId | null>(null)
  const [isolatePart, setIsolatePart] = useState(false)
  const [hidden, setHidden] = useState<Set<string>>(new Set())
  const [cadStatus, setCadStatus] = useState<'schematic' | 'cad'>('schematic')
  const [cadPreference, setCadPreference] = useState<boolean | null>(null)
  const [failure, setFailure] = useState(() => !supportsWebGL())
  const [animation, setAnimation] = useState<{ from: number, to: number } | null>(null)
  const [notice, setNotice] = useState('')
  const [expanded, setExpanded] = useState(false)
  const viewport = useRef<HTMLElement>(null)
  const compact = useMedia('(max-width: 730px), (pointer: coarse)')
  const reducedMotion = useMedia('(prefers-reduced-motion: reduce)')
  const part = partById.get(selected) ?? parts[0]
  const visible = useMemo(() => new Set(parts.filter(item => !hidden.has(item.id)
    && (!assembly || item.assemblyId === assembly) && (!isolatePart || item.id === part.id)).map(item => item.id)),
    [assembly, hidden, isolatePart, part.id])
  const select = (id: string) => {
    if (assembly && partById.get(id)?.assemblyId !== assembly) setAssembly(null)
    onSelect(id)
  }
  const onFailure = useCallback(() => setFailure(true), [])
  const change = (distance: number) => { setAnimation(null); setAmount(distance) }
  const focusCamera = (value: Preset) => { setPreset(value); setRecalled(null); setCameraTick(tick => tick + 1) }
  const reset = () => {
    change(0); setAssembly(null); setIsolatePart(false); setHidden(new Set()); setCutaway('Full')
    setLayer('Model'); setWireframe(false); setOpacity(1); setDimensioning(false); setMeasuring(false); setPoints([]); focusCamera('Iso')
  }
  const toggleAnimation = () => {
    if (animation) return setAnimation(null)
    const destination = amount >= 99.9 ? 0 : 100
    if (reducedMotion) change(destination)
    else setAnimation({ from: amount, to: destination })
  }
  useEffect(() => {
    if (!animation) return
    let frame = 0
    const start = performance.now()
    const duration = 2800 * Math.max(0.2, Math.abs(animation.to - animation.from) / 100)
    const animate = (time: number) => {
      const t = Math.min(1, (time - start) / duration)
      setAmount(animation.from + (animation.to - animation.from) * t)
      if (t < 1) frame = requestAnimationFrame(animate)
      else setAnimation(null)
    }
    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [animation])
  useEffect(() => {
    const update = () => setExpanded(document.fullscreenElement === viewport.current)
    document.addEventListener('fullscreenchange', update)
    return () => document.removeEventListener('fullscreenchange', update)
  }, [])
  const toggleFullscreen = async () => {
    if (expanded && document.fullscreenElement) await document.exitFullscreen()
    else if (expanded) setExpanded(false)
    else {
      try { await viewport.current?.requestFullscreen(); if (!document.fullscreenElement) setExpanded(true) }
      catch { setExpanded(true) }
    }
  }
  const viewerProps: ViewerProps = {
    selected: part.id, onSelect: select, visible, fraction: amount / 100, isolate: Boolean(assembly || isolatePart),
    cutaway, layer, preset, cameraTick, snapshot, recalled, measure: measuring ? position => setPoints(prev => prev.length < 2 ? [...prev,position] : [position]) : null, wireframe, opacity, perspective, labels, reducedMotion, compact,
    onFailure, dimensioning, cadDetail: cadPreference ?? !compact, onCadStatus: setCadStatus, ...telemetry,
  }
  const fallback = <ViewerFallback {...viewerProps} />
  return <>
    <header className="page-header">
      <div><div className="eyebrow">TE-01 / ASSEMBLY DOCUMENTATION</div><h1>Assembly Explorer</h1>
        <p>Interactive engineering model and component reference.</p></div>
      <div className="revision-mark"><span><i /> Preliminary design</span><small>REV 0.1</small></div>
    </header>
    <div className="workspace">
      <PartsTree selected={part.id} onSelect={select} scope={assembly} onScope={id => { setAssembly(id); setIsolatePart(false) }}
        hidden={hidden} toggleHidden={id => setHidden(previous => {
          const next = new Set(previous)
          if (next.has(id)) next.delete(id)
          else next.add(id)
          return next
        })} />
      <section className="viewer panel" aria-label="Assembly viewport" ref={viewport} data-expanded={expanded}>
        <div className="viewer-top"><div><Box size={16} /><h2>TE-01 Digital Twin</h2></div><span className="model-status"><i /> {cadStatus === 'cad' ? 'CAD SCHEMATIC' : 'SCHEMATIC GEOMETRY'}</span></div>
        <div className="viewport-tabs" role="group" aria-label="Model layers">
          {layers.map(value => <button key={value} type="button" aria-pressed={layer === value} onClick={() => setLayer(value)}>{value}</button>)}
        </div>
        <div className="viewport-content">
          <div className="viewport-caption" aria-hidden="true">{assembly ? `${assembly} / ISOLATED` : isolatePart ? `${part.id} / ISOLATED` : `TE-01 / ${amount > 0 ? 'EXPLODED' : 'ASSEMBLED'}`}</div>
          {failure ? fallback : <GraphicsBoundary fallback={fallback}>
            <Suspense fallback={<div className="viewer-loading">Loading assembly geometry…</div>}><Viewer3D {...viewerProps} /></Suspense>
          </GraphicsBoundary>}
          <div className="viewport-tools" role="group" aria-label="Viewer controls">
            <button type="button" className="icon-button" title="Fit model" aria-label="Fit model" onClick={() => focusCamera(preset)}><Crosshair size={17} /></button>
            <button type="button" className="icon-button" title="Wireframe" aria-label="Wireframe" aria-pressed={wireframe} onClick={() => setWireframe(!wireframe)}><Grid2X2 size={16} /></button>
            <button type="button" className="icon-button" title="Show baseplate dimensions" aria-label="Show baseplate dimensions" aria-pressed={dimensioning}
              onClick={() => { setDimensioning(!dimensioning); if (amount) change(0) }}><Ruler size={16} /></button>
            <button type="button" className="icon-button" title="View options" aria-label="View options" aria-expanded={options} onClick={() => showOptions(!options)}><Settings2 size={16} /></button>
            <button type="button" className="icon-button" title="Expand viewport" aria-label={expanded ? 'Restore viewport' : 'Expand viewport'} onClick={() => void toggleFullscreen()}><Maximize size={15} /></button>
          </div>
          {options && <div className="view-options">
            <label><ScanLine size={15} /> Section
              <select value={cutaway} onChange={event => setCutaway(event.target.value as Cutaway)}>
                {(['Full','Guard off','Longitudinal','Transverse'] as Cutaway[]).map(mode => <option key={mode}>{mode}</option>)}
              </select>
            </label>
            <label><Eye size={15} /> X-ray opacity<input type="range" min="0.2" max="1" step="0.05" value={opacity} onChange={event => setOpacity(Number(event.target.value))} /></label>
            <label><Camera size={15} /> Perspective<input type="checkbox" checked={perspective} onChange={event => setPerspective(event.target.checked)} /></label>
            <label><Layers size={15} /> CAD mesh<input type="checkbox" checked={viewerProps.cadDetail} onChange={event => setCadPreference(event.target.checked)} /></label>
            <label><Box size={15} /> Callouts<input type="checkbox" checked={labels} onChange={event => setLabels(event.target.checked)} /></label>
            <label><Ruler size={15} /> Point measurement<input type="checkbox" checked={measuring} onChange={event => { setMeasuring(event.target.checked); setPoints([]) }} /></label>
            <div className="bookmark"><button type="button" onClick={() => {
              if (!snapshot.current) return
              localStorage.setItem('te01.camera',JSON.stringify(snapshot.current)); setNotice('Camera position saved')
            }}>Save view</button>
              <button type="button" onClick={() => {
                try {
                  const saved = JSON.parse(localStorage.getItem('te01.camera') ?? 'null') as ViewBookmark | null
                  if (!saved || ![...saved.position,...saved.target,saved.zoom].every(Number.isFinite)) return
                  setPerspective(saved.perspective); setRecalled(saved); setCameraTick(tick => tick+1); setNotice('Camera position recalled')
                } catch { setNotice('Camera position unavailable') }
              }}>Recall view</button></div>
            <span className="sr-only" role="status">{notice}</span>
          </div>}
          {measuring && <div className="measurement-readout" aria-live="polite">{points.length === 2
            ? `Schematic distance · ${Math.hypot(...points[0].map((value,i) => value-points[1][i])).toFixed(1)} mm`
            : `Select ${points.length ? 'the second point' : 'two surface points'}`}</div>}
          {dimensioning && <div className="dimension-readout">Baseplate target · 300 × 200 mm</div>}
          {telemetry && <div className="diagnostic-readout">SIMULATION · {Math.round(telemetry.speedRpm ?? 0)} rpm · {telemetry.motorTemperature?.toFixed(1) ?? '—'} °C</div>}
          <div className="camera-presets" role="group" aria-label="Camera presets">
            {presets.map(value => <button key={value} aria-pressed={preset === value} type="button" onClick={() => focusCamera(value)}>{value}</button>)}
          </div>
          <div className="axes" role="group" aria-label="Machine axes, X shaft, Y transverse, Z up"><b>Z</b><i /><b>Y</b><i /><b>X</b><i /></div>
        </div>
        <ExplodeSlider amount={amount} change={change} running={Boolean(animation)} toggle={toggleAnimation} reset={reset} />
        <div className="viewport-help"><Move size={13} />{compact ? 'Drag to orbit · Pinch to zoom · Two fingers to pan' : 'Drag to orbit · Scroll to zoom · Arrow keys to pan'}</div>
      </section>
      <PartInspector part={part} isolated={isolatePart} onIsolate={() => {
        setIsolatePart(!isolatePart); setAssembly(null)
        if (hidden.has(part.id)) setHidden(previous => new Set([...previous].filter(id => id !== part.id)))
      }} />
    </div>
    <div className="system-cards" role="group" aria-label="Assembly design targets">
      <div><Layers /><span>Canonical assemblies</span><strong>{String(assemblies.length).padStart(2, '0')}</strong></div>
      <div><Box /><span>Component records</span><strong>{parts.length}</strong></div>
      <div><Crosshair /><span>Rotor speed target</span><strong>300–3,000 <small>rpm</small></strong></div>
      <div><Ruler /><span>Supply target</span><strong>24 <small>V DC</small></strong></div>
    </div>
  </>
}
