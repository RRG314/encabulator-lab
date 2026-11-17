import { lazy, Suspense, useCallback, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { archive, archiveCad, archiveProfile } from '../machines/archive'
import { machineRoute, machines } from '../machines/profiles'
import type { DisplayProfile } from '../machines/profiles'
import { GraphicsBoundary, supportsWebGL, ViewerFallback } from '../components/ViewerFallback'
import type { Preset, ViewBookmark, ViewerProps } from '../components/Viewer3D'
import type { Vec3 } from '../model/geometry'

const Viewer3D=lazy(()=>import('../components/Viewer3D'))
const candidates:DisplayProfile[]=[
  ...Object.values(machines).map(machine=>({...machine,href:(path:string)=>machineRoute(machine.key,path)})),
  ...archive.flatMap(record=>archiveCad[record.id]?[archiveProfile(record,archiveCad[record.id])]:[]),
]
const presets:Preset[]=['Iso','Front','Side','Top']

export function InspectionViewport({machine,fraction,preset,cameraTick,linkedDirection,onOrientation,selectedPart,onSelectPart,
  autoOrbit=false,reducedMotion=true,opacity=1,labels=false,poster,children}:{
  machine:DisplayProfile;fraction:number;preset:Preset;cameraTick:number;linkedDirection?:Vec3;onOrientation?:(direction:Vec3)=>void
  selectedPart?:string;onSelectPart?:(id:string)=>void;autoOrbit?:boolean;reducedMotion?:boolean;opacity?:number;labels?:boolean;poster?:string;children?:ReactNode
}){
  const visible=useMemo(()=>new Set(machine.placements.map(p=>p.partId)),[machine])
  const [localSelection,setLocalSelection]=useState(machine.defaultPart)
  const selected=selectedPart??localSelection
  const [failed,setFailed]=useState(()=>!supportsWebGL())
  const [status,setStatus]=useState<'schematic'|'cad'>('schematic')
  const onFailure=useCallback(()=>setFailed(true),[])
  const snapshot=useRef<ViewBookmark|null>(null)
  const props:ViewerProps={
    machine,fraction,preset,cameraTick,linkedDirection,onOrientation,visible,selected,onSelect:onSelectPart??setLocalSelection,autoOrbit,
    explosionParts:null,isolate:false,cutaway:'Full',layer:'Model',cameraFocus:null,snapshot,recalled:null,measure:null,
    wireframe:false,opacity,perspective:false,labels,reducedMotion,compact:true,
    cadDetail:true,onCadStatus:setStatus,onFailure,dimensioning:false,
  }
  const part=machine.registry.partById.get(selected)
  const fallback=<ViewerFallback {...props}/>
  return <section className="panel comparison-model">
    <div className="panel-title"><h3>{machine.name} {machine.code}</h3><span className="data-tag">{status==='cad'?'CAD schematic':failed?'Station diagram':'Loading'}</span></div>
    <div className="viewport-content">
      {poster&&status!=='cad'&&!failed&&<img src={poster} alt="" className="viewport-poster"/>}
      {failed?fallback:<GraphicsBoundary fallback={fallback}>
      <Suspense fallback={<p className="viewer-loading">Loading assembly geometry…</p>}><Viewer3D {...props}/></Suspense>
    </GraphicsBoundary>}</div>
    <div className="comparison-record">
      {part&&<a href={machine.href('component/'+part.id)}>{part.id} · {part.name}</a>}
      <a href={machine.href('explorer')}>Assembly workbench</a>
    </div>
    {children}
  </section>
}

export default function AssemblyComparison(){
  const [keys,setKeys]=useState(['te01','re01',''])
  const [fraction,setFraction]=useState(0)
  const [preset,setPreset]=useState<Preset>('Iso')
  const [direction,setDirection]=useState<Vec3>()
  const [tick,setTick]=useState(0)
  const selected=keys.flatMap(key=>{const candidate=candidates.find(item=>item.key===key);return candidate?[candidate]:[]})
  const dimensions=selected.map(machine=>machine.baseMm.join(' × ')+' mm')
  const rows=[
    ['Reference footprint',...dimensions],
    ['Physical definitions',...selected.map(machine=>machine.registry.parts.filter(p=>p.kind!=='logical').length)],
    ['Placed instances',...selected.map(machine=>machine.placements.length)],
    ['Subassemblies',...selected.map(machine=>machine.registry.assemblies.length)],
    ['Revision',...selected.map(machine=>machine.registry.parts[0].revision)],
  ]
  return <>
    <section className="panel archive-index" aria-label="Interactive assembly comparison">
      <div className="panel-title"><h2>Side-by-side assemblies</h2></div>
      <div className="archive-filters">
        {keys.map((value,i)=><label key={i}>Configuration {i+1}<select value={value} onChange={event=>setKeys(old=>old.map((key,j)=>j===i?event.target.value:key))}>
          {i===2&&<option value="">Two assemblies</option>}
          {candidates.map(item=><option key={item.key} value={item.key} disabled={keys.includes(item.key)&&item.key!==value}>{item.code} · {item.name}</option>)}
        </select></label>)}
        <label>Shared separation <output>{Math.round(fraction*100)}%</output><input aria-label="Shared separation" type="range" min="0" max="100" value={fraction*100} onChange={event=>setFraction(+event.target.value/100)}/></label>
      </div>
      <div className="comparison-controls" role="group" aria-label="Shared camera orientation">
        {presets.map(value=><button key={value} className="secondary-button" type="button" aria-pressed={!direction&&preset===value} onClick={()=>{setPreset(value);setDirection(undefined);setTick(tick+1)}}>{value}</button>)}
      </div>
    </section>
    <div className="comparison-viewports" data-columns={selected.length}>
      {selected.map(machine=><InspectionViewport key={machine.key} machine={machine} fraction={fraction} preset={preset} cameraTick={tick} linkedDirection={direction} onOrientation={setDirection}/>)}
    </div>
    <section className="panel article-panel table-scroll">
      <table aria-label="Selected assembly specifications">
        <thead><tr><th scope="col">Engineering record</th>{selected.map(machine=><th scope="col" key={machine.key}>{machine.code}</th>)}</tr></thead>
        <tbody>{rows.map(([name,...values])=><tr key={name}><th scope="row">{name}</th>{values.map((value,i)=><td key={selected[i].key}>{value}</td>)}</tr>)}</tbody>
      </table>
    </section>
  </>
}
