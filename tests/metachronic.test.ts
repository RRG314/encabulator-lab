import { readFileSync, existsSync, writeFileSync } from 'node:fs'
import { afterAll, describe, expect, it } from 'vitest'
import { integrityErrors } from '../src/data'
import { machines, readRoute } from '../src/machines/profiles'
import families from '../data/me01/scientific.json'
import { controls, scientificStudy, complexTone, commutatorAngle, dynamicStiffness, entropyProduction, magneticLoss, nextHysteresis } from '../src/simulation/metachronic/physics'
import { dynamicFaults, me01Simulation, defaultOptions, hosts } from '../src/simulation/metachronic/plant'
import type { Options } from '../src/simulation/metachronic/plant'
import { compareInstallation } from '../src/simulation/metachronic/installation'
import { shaftCases, screening } from '../src/simulation/calculations'
import { rpmToRad } from '../src/simulation/numerics'

const evidence:{condition:string,expected:number,observed:number,absoluteError:number,tolerance:number,status:string}[]=[]
const path=(name:string)=>new URL(`../${name}`,import.meta.url)
const modelFile=(name:string)=>path(`public/models/me01/${name}`)
const stepS=.002
const endS=9
const nominal=me01Simulation(defaultOptions,stepS,endS)
type Sample=typeof nominal[number]
const columns = [
  ['time_s', (r:Sample)=>r.t], ['primary_speed_rpm', (r:Sample)=>r.rpm],
  ['secondary_speed_rpm', (r:Sample)=>r.secondaryRpm], ['relative_phase_rad', (r:Sample)=>r.phaseRad],
  ['vane_pitch_deg', (r:Sample)=>r.pitch], ['coupling_torque_Nm', (r:Sample)=>r.torque],
  ['radial_displacement_um', (r:Sample)=>r.vibration], ['radial_force_N', (r:Sample)=>r.actuator],
  ['air_flow_m3_s', (r:Sample)=>r.cooling], ['loop_flow_mL_s', (r:Sample)=>r.flow*1e6], ['loop_pressure_Pa', (r:Sample)=>r.pressure],
  ['motor_C', (r:Sample)=>r.motor], ['bearing_C', (r:Sample)=>r.bearing], ['effective_clearance_um', (r:Sample)=>r.clearanceMicrons],
  ['dc_link_V', (r:Sample)=>r.busV], ['input_with_radial_W', (r:Sample)=>r.busPower], ['drive_supply_A', (r:Sample)=>r.current],
  ['recovered_to_link_W', (r:Sample)=>r.regenW], ['energy_residual_J', (r:Sample)=>r.audit],
  ['controller_mode', (r:Sample)=>r.mode],
] as const

const nominalSampleSpacingS=nominal[1].t
const hostIds=Object.keys(hosts) as Options['host'][]
const installation=hostIds.map(host=>{
  const result=compareInstallation(host,1500)
  return {host, reflectedInertiaKgM2:result.assumedInertia, directRpm:result.base.at(-1)!.rpm,
    nominalPitchRpm:result.nominal.at(-1)!.secondaryRpm, reducedPitchRpm:result.alternative.at(-1)!.secondaryRpm}
})
const shaftScreen = shaftCases.me01
const shaftResults=screening(shaftScreen)

// The placement rotation is about global X. Only the transverse centroid offset
// enters the parallel-axis term for the +X shaft line.
function estimateAxialInertia(ids:readonly string[]) {
  const {placements,service,registry,shaftHeight}=machines.me01
  return placements.filter(placement=>ids.includes(placement.partId)).reduce((sum,p)=>{
    const part=registry.partById.get(p.partId)!
    const properties=service[p.partId]
    const [,y,z]=properties.centerMm!
    const c=Math.cos(p.rotation),s=Math.sin(p.rotation)
    const dy=p.origin[1]+c*y-s*z,dz=p.origin[2]+s*y+c*z-shaftHeight
    return sum+properties.centroidAxisInertiaKgM2![0]+part.massKg!*(dy**2+dz**2)*1e-6
  },0)
}
const primaryMeshIds=['ME-005','ME-012','ME-013','ME-014']
const secondaryMeshIds=['ME-006','ME-030']
const last=nominal.at(-1)!
const benchmarks={
  basis:'Calculated and simulated reference cases with nominal assumptions',
  revision:'0.1',
  integration:{method:'Classical RK4',stepS,endS,nominalSampleSpacingS,samples:nominal.length},
  inputs:defaultOptions,
  nominalPeaks:{
    primaryRpm:Math.max(...nominal.map(row=>row.rpm)),
    secondaryRpm:Math.max(...nominal.map(row=>row.secondaryRpm)),
    recoveredPowerW:Math.max(...nominal.map(row=>row.regenW)),
    displacementUm:Math.max(...nominal.map(row=>row.vibration)),
    absoluteEnergyResidualJ:Math.max(...nominal.map(row=>Math.abs(row.audit))),
  },
  snapshots:[nominal[0],nominal.find(row=>row.t>=3)!,nominal.findLast(row=>row.t<6)!,nominal.find(row=>row.t>=6)!,last],
  installation:{requestRpm:1500, regeneration:false, pitchCommandsDeg:[14,8], resultsAt9S:installation},
  shaftScreen:{inputs:shaftScreen,results:shaftResults},
  axialInertia:{
    primaryPartIds:primaryMeshIds, secondaryPartIds:secondaryMeshIds,
    primaryGeometryKgM2:estimateAxialInertia(primaryMeshIds), secondaryGeometryKgM2:estimateAxialInertia(secondaryMeshIds),
    basis:'Selected CAD solid sets at nominal pitch, generic densities, placed-centre parallel-axis calculation',
  },
}
function numeric(condition:string,expected:number,observed:number,tolerance:number) {
  const absoluteError=Math.abs(observed-expected)
  evidence.push({condition,expected,observed,absoluteError,tolerance,status:absoluteError<=tolerance?'PASS':'FAIL'})
  expect(absoluteError,condition).toBeLessThanOrEqual(tolerance)
}
afterAll(()=>{
  if(process.env.TE01_WRITE_NUMERICAL!=='1') return
  writeFileSync(modelFile('numerical-validation.json'),
    JSON.stringify({basis:'Deterministic numerical and analytical reference cases',revision:'0.1',readings:evidence},null,2)+'\n')
  writeFileSync(modelFile('benchmarks.json'),JSON.stringify(benchmarks,null,2)+'\n')
  const rows=nominal.map(sample=>columns.map(([,read])=>{
    const value=read(sample)
    return typeof value==='number'?Number(value.toPrecision(12)):value
  }).join(','))
  writeFileSync(modelFile('nominal-trajectory.csv'),[columns.map(([label])=>label).join(','),...rows].join('\n')+'\n')
})
describe('Metachronic model and parametric evidence',()=>{
  it('uses the canonical route and verifies registry and CAD coverage without representing software as a solid',()=>{
    expect(readRoute('#/me01/component/ME-040')).toEqual({model:'me01',page:'component',param:'ME-040'})
    const me=machines.me01
    expect(integrityErrors(me.registry)).toEqual([])
    expect(me.registry.assemblies).toHaveLength(35)
    const physical=me.registry.parts.filter(part=>part.kind!=='logical')
    const logical=me.registry.parts.filter(part=>part.kind==='logical')
    expect(families).toHaveLength(21)
    expect(logical.length).toBeGreaterThan(0)
    const buf=readFileSync(path(`public/${me.mesh}`))
    expect(buf.toString('utf8',0,4)).toBe('glTF')
    expect(buf.readUInt32LE(8)).toBe(buf.byteLength)
    const glb=JSON.parse(buf.toString('utf8',20,20+buf.readUInt32LE(12))) as {nodes:{name:string}[],meshes:{name:string}[]}
    expect(new Set(glb.meshes.map(item=>item.name))).toEqual(new Set(physical.map(part=>part.id)))
    expect(glb.nodes.map(n=>n.name)).toEqual(me.placements.map(p=>p.key))
    expect(me.placements.filter(p=>p.partId==='ME-013')).toHaveLength(6)
    expect(physical.every(part=>!!part.massKg && !!me.service[part.id].centerMm&&existsSync(path(`public/${part.cadAssetPath}`))&&existsSync(path(`public/${part.diagramRefs[0]}`)))).toBe(true)
    expect(logical.every(part=>part.cadAssetPath===null&&part.massKg===null&&!me.placements.some(p=>p.partId===part.id))).toBe(true)
    const audit=JSON.parse(readFileSync(path('public/models/me01/validation.json'),'utf8')) as {checks:{status:string,check:string}[]}
    expect(audit.checks.filter(row=>row.status==='FAIL')).toEqual([])
  })
  it('computes all 21 stations at nominal and boundary controls',()=>{
    for(const family of families) {
      const control=controls[family.number]
      for(const value of [control.min,control.initial,control.max]) {
        const output=scientificStudy(family.number,value)
        expect(output.unit).toBeTruthy()
        for(const series of output.series) expect(series.data.length===output.x.length && series.data.every(Number.isFinite)).toBe(true)
      }
    }
    numeric('Linear quadrupole gradient at 16 mm (mT)',128,scientificStudy(40,8).series[0].data.at(-1)!,1e-9)
    numeric('Magnetic loss under doubled field',4,magneticLoss(1.4,.36,.058,.6)/magneticLoss(1.4,.18,.058,.6),1e-9)
    numeric('Zero thermal difference entropy production (W/K)',0,entropyProduction(70,310,310),1e-12)
    numeric('Static dynamic stiffness (N/m)',1700,dynamicStiffness(.34,7,1700,0),1e-12)
    numeric('Rotation commutator on zero second angle (rad)',0,commutatorAngle(1,0),1e-10)
    expect(commutatorAngle(1,1)).toBeGreaterThan(.5)
    expect(nextHysteresis(false,47,.3,40,37,.5)).toBe(false)
    expect(nextHysteresis(false,47,.5,40,37,.5)).toBe(true)
    expect(scientificStudy(51,.12)).toEqual(scientificStudy(51,.12))
    const samples=Array.from({length:400},(_,i)=>Math.cos(2*Math.PI*12*.005*i))
    numeric('Synchronous DFT coefficient',1,2*Math.hypot(...complexTone(samples,.005,12))/400,1e-12)
  })
})
describe('Coupled model',()=>{
  it('accounts for both shafts, output fluid demand, heat and nominal DC energy',()=>{
    const run=nominal
    expect(run[0].flow).toBe(0)
    expect(run.some(row=>row.regenW>0)).toBe(true)
    expect(Math.max(...run.map(r=>r.busV))).toBeLessThanOrEqual(39.01)
    expect(Math.max(...run.map(r=>r.flow))).toBeGreaterThan(0)
    const last=run.at(-1)!
    const smaller=me01Simulation(defaultOptions,.001).at(-1)!
    numeric('Motor-drive energy residual at 9 s (J)',0,last.audit,.2)
    numeric('Primary rpm timestep sensitivity',smaller.rpm,last.rpm,1.2)
    numeric('Secondary rpm timestep sensitivity',smaller.secondaryRpm,last.secondaryRpm,1.2)
    expect(Math.abs(last.rpm-last.secondaryRpm)).toBeLessThan(14)
    expect(last.motor).toBeGreaterThan(defaultOptions.ambient)
    expect(last.clearanceMicrons).toBeLessThan(92)
  })
  it('verifies the coupling identity, capacitor headroom, and centered shaft screen',()=>{
    numeric('Coupling relation maximum absolute residual (N·m)',0,Math.max(...nominal.map(row=>
      Math.abs(row.torque-(5.4*row.phaseRad+.065*rpmToRad(row.rpm-row.secondaryRpm))))),1e-9)
    numeric('Nominal recovered DC energy at 9 s (J)',4.275,.5*.038*(last.busV**2-36**2),1e-8)
    const noRegen=me01Simulation({...defaultOptions,regen:false})
    numeric('DC-link voltage with regeneration disabled (V)',36,noRegen.at(-1)!.busV,1e-10)
    expect(noRegen.every(row=>row.regenW===0)).toBe(true)
    numeric('Centered 63 N shaft load, left reaction (N)',31.5,shaftResults.left,1e-12)
    numeric('Centered 63 N shaft load, right reaction (N)',31.5,shaftResults.right,1e-12)
    numeric('Centered shaft-load deflection (µm)',85.1516865,shaftResults.deflection*1e6,1e-6)
    expect(installation.every(row=>row.reducedPitchRpm>row.nominalPitchRpm)).toBe(true)
    expect(benchmarks.axialInertia.primaryGeometryKgM2).toBeCloseTo(.0020623407,9)
    expect(benchmarks.axialInertia.secondaryGeometryKgM2).toBeCloseTo(.0005476191,10)
  })
  it('uses the defined host boundary and asserts the guard, sensor and electrical trips',()=>{
    const outputs=hostIds.map(host=>me01Simulation({...defaultOptions,host}).at(-1)!)
    expect(new Set(outputs.map(p=>p.torque.toFixed(4))).size).toBeGreaterThan(3)
    const tripScenarios=new Set<Options['fault']>(['Guard open','Sensor failure','Phase synchronization loss',
      'Electrical overcurrent','Thermal overload','Torsional displacement','Controller instability'])
    for(const fault of dynamicFaults.slice(1)) {
      const trajectory=me01Simulation({...defaultOptions,fault})
      expect(trajectory.findLast(p=>p.t<3)!.fault).toBe('')
      const row=trajectory.find(p=>p.t>=3.1)!
      expect(row.fault).toBeTruthy()
      expect(row.mode).toBe(tripScenarios.has(fault)?'Fault-latched':'Degraded')
      if(tripScenarios.has(fault)) numeric(`${fault}: disabled drive input (A)`,0,row.current,1e-12)
    }
  })
  it('keeps the published nominal trajectory and benchmark metadata aligned with the solver',()=>{
    if(process.env.TE01_WRITE_NUMERICAL==='1') return
    const published=JSON.parse(readFileSync(modelFile('benchmarks.json'),'utf8')) as typeof benchmarks
    expect(published.inputs).toEqual(defaultOptions)
    expect(published.integration).toEqual(benchmarks.integration)
    expect(published.installation.resultsAt9S.map(row=>row.host)).toEqual(hostIds)
    expect(published.snapshots.at(-1)!.rpm).toBeCloseTo(last.rpm,8)
    expect(published.snapshots.at(-1)!.busV).toBeCloseTo(last.busV,8)
    const [header,...data]=readFileSync(modelFile('nominal-trajectory.csv'),'utf8').trim().split('\n')
    expect(header.split(',')).toEqual(columns.map(([key])=>key))
    expect(data).toHaveLength(nominal.length)
    for (const [i,row] of data.entries()) {
      const values=row.split(',')
      expect(values).toHaveLength(columns.length)
      for (const [j,[key,read]] of columns.entries()) {
        const expected=read(nominal[i])
        if(typeof expected==='number') {
          const tolerance=Math.max(1e-9,Math.abs(expected)*1e-11)
          expect(Math.abs(Number(values[j])-expected),`Row ${i+1} ${key}`).toBeLessThanOrEqual(tolerance)
        } else expect(values[j]).toBe(expected)
      }
    }
  })
})
