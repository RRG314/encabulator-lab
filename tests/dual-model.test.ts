import { readFileSync, existsSync, writeFileSync } from 'node:fs'
import { afterAll, describe, expect, it } from 'vitest'
import { integrityErrors } from '../src/data'
import { machineRoute, machines, readRoute } from '../src/machines/profiles'
import { simulationProfiles } from '../src/schemas/simulation'
import { automate, benchProfiles, benchStep, crankKinematics, crankPosition, initialBench, pumpPoint } from '../src/simulation/automation'
import { study } from '../src/simulation/studies'
import { faults } from '../src/simulation/plant'
import type { BenchCommand } from '../src/simulation/automation'
import trace from '../data/re01/source-traceability.json'

const report: {condition:string,expected:number,observed:number,absoluteError:number,tolerance:number,status:string}[]=[]
const parity: {configuration:string,checks:Record<string,boolean>}[]=[]
const dir=(path:string)=>new URL(`../${path}`,import.meta.url)
const request: BenchCommand={run:true,rpm:1550,voltage:48,fan:.72,fault:'None',pressureHeadKPa:18,loadNm:benchProfiles.re01.load}

function check(condition:string,expected:number,observed:number,tolerance:number) {
  const absoluteError=Math.abs(expected-observed)
  report.push({condition,expected,observed,absoluteError,tolerance,status:absoluteError<=tolerance?'PASS':'FAIL'})
  expect(absoluteError,condition).toBeLessThanOrEqual(tolerance)
}
afterAll(()=>{
  if(process.env.TE01_WRITE_NUMERICAL==='1') {
    writeFileSync(dir('public/models/re01/numerical-validation.json'),JSON.stringify({revision:'0.1',basis:'Deterministic model and closed-form reference',readings:report},null,2)+'\n')
    writeFileSync(dir('public/models/parity.json'),JSON.stringify({revision:'0.1',basis:'Digital assets, registries and configurations',configurations:parity,
      scope:'Browser interactions are tested separately. Manufacturing release remains open.'},null,2)+'\n')
  }
})
describe('independent machine parity',()=>{
  it('preserves old TE URLs and resolves the independent Retro routes',()=>{
    expect(readRoute('#/component/TE-009')).toEqual({model:'te01',page:'component',param:'TE-009'})
    expect(readRoute(machineRoute('re01','component/RE-008'))).toEqual({model:'re01',page:'component',param:'RE-008'})
  })
  for (const machine of Object.values(machines)) {
    it(`${machine.code} has independent linked records, native solids, downloads, draws and original GLB mesh coverage`,()=>{
      expect(integrityErrors(machine.registry)).toEqual([])
      const parts=new Set(machine.registry.parts.map(p=>p.id))
      const glb=readFileSync(dir(`public/${machine.mesh}`))
      expect(glb.toString('utf8',0,4)).toBe('glTF')
      expect(glb.readUInt32LE(8)).toBe(glb.byteLength)
      const doc=JSON.parse(glb.toString('utf8',20,20+glb.readUInt32LE(12))) as {nodes:{name:string,extras:{partId:string}}[],meshes:{name:string}[]}
      expect(new Set(doc.meshes.map(m=>m.name))).toEqual(parts)
      expect(doc.nodes.map(node=>node.name)).toEqual(machine.placements.map(p=>p.key))
      const shape=JSON.parse(readFileSync(dir(`public/${machine.assetFolder}/validation.json`),'utf8')) as {checks:{status:string}[]}
      const expected=machine.key==='te01'
        ? ['te01-assembled.FCStd','te01-exploded.step','te01-section-x.step','te01-part-solids.zip','te01-drawings-svg.zip']
        : ['re01-assembled.FCStd','re01-exploded.step','re01-transverse.step','part-solids.zip','drawings.zip','bom.csv']
      const checks={
        nativeSources: existsSync(dir(machine.key==='te01'?'cad/te01_master_assembly.py':'cad/models/re01/master_assembly.py')),
        poseIdentity: new Set(machine.placements.map(p=>p.key)).size===doc.nodes.length,
        serviceCoverage: machine.registry.parts.every(p=>!!machine.service[p.id]?.tool&&!!machine.service[p.id]?.envelopeMm?.length),
        assembledAndSeparated: machine.placements.some(p=>p.offset.some(value=>value!==0))&&doc.nodes.length>parts.size,
        exportsAndDrawings: expected.every(file=>existsSync(dir(`public/${machine.assetFolder}/${file}`))),
        geometryChecks: shape.checks.every(check=>check.status!=='FAIL'),
        studyCoverage: simulationProfiles[machine.key].some(x=>x.id==='integrated')&&simulationProfiles[machine.key].length>=10,
      }
      if(machine.key==='re01') {
        expect(machine.registry.parts).toHaveLength(49)
        expect(machine.registry.assemblies).toHaveLength(15)
        expect(machine.placements.filter(item=>item.partId==='RE-008')).toHaveLength(6)
        expect(machine.registry.parts.every(part=>part.massKg && part.dimensionsMm && existsSync(dir(`public/${part.cadAssetPath}`)) &&
          existsSync(dir(`public/${part.diagramRefs[0]}`)))).toBe(true)
        expect(Object.values(machine.service).every(item=>!item.source||item.source in trace.terms)).toBe(true)
      }
      parity.push({configuration:machine.code,checks})
      expect(Object.entries(checks).filter(([,passed])=>!passed)).toEqual([])
    })
  }
  it('runs every Retro study at its declared defaults and extremes',()=>{
    for (const config of simulationProfiles.re01) for (const bound of ['default','min','max'] as const) {
      expect(config.inputs.every(input=>input.default>=input.min&&input.default<=input.max),config.id).toBe(true)
      const params=Object.fromEntries(config.inputs.map(input=>[input.id,input[bound]]))
      const result=study(config.id,params,'None',false,'re01')
      expect(result.charts.length).toBeGreaterThan(0)
      for(const chart of result.charts) for(const series of chart.series) {
        expect(series.data).toHaveLength(chart.x.length)
        expect(series.data.every(value=>value===null||Number.isFinite(value))).toBe(true)
      }
    }
  })
})

describe('Retro linkage, delivery and automation',()=>{
  it('closes the crank-slider loop across a full revolution',()=>{
    for(let i=0;i<361;i++) {
      const kin=crankPosition(i*Math.PI/180)
      expect(Math.abs(Math.hypot(kin.sliderX-kin.pinX,kin.pinY)-68)).toBeLessThan(1e-10)
    }
    check('Closed-form crank-slider stroke (mm)',24,crankKinematics(0,1).positionMm-crankKinematics(Math.PI,1).positionMm,1e-10)
    const derivative=(crankKinematics(0.8+1e-5,1).positionMm-crankKinematics(0.8-1e-5,1).positionMm)/(2e-5)
    check('Analytical slider velocity at 0.8 rad (mm/s)',derivative,crankKinematics(.8,1).velocityMmS,1e-7)
    const second=(crankKinematics(.8+1e-5,1).velocityMmS-crankKinematics(.8-1e-5,1).velocityMmS)/(2e-5)
    check('Analytical slider acceleration at 0.8 rad (mm/s²)',second,crankKinematics(.8,1).accelerationMmS2,1e-7)
    check('Zero-speed pump delivery (m³/s)',0,pumpPoint(0,18).q,1e-12)
    const pump=pumpPoint(150,18)
    check('Fluid power identity (W)',pump.pressure*pump.q,pump.work,1e-12)
  })
  it('tracks a setpoint, closes energy within timestep tolerance and reacts deterministically',()=>{
    const points=automate(request)
    expect(automate(request)).toEqual(points)
    const end=points.at(-1)!
    check('10 s speed setpoint tracking (rpm)',1550,end.rpm,1e-4)
    check('Timestep sensitivity 5 ms against 2.5 ms, final speed (rpm)',automate(request,'re01',.0025).at(-1)!.rpm,end.rpm,.01)
    check('Drive accounting residual (J), 5 ms integration',0,end.auditJ,.8)
    expect(end.waterFlow).toBeGreaterThan(0)
    expect(end.motor).toBeGreaterThan(22)
    expect(benchStep('re01',initialBench,{...request,run:false}).mode).toBe('Standby')
  })
  it('latches each sustained simulated fault and requires a separate reset',()=>{
    for(const fault of faults.filter(f=>f!=='None')) {
      const states=automate({...request,fault})
      const early=states.find(row=>row.t>=2)!
      const late=states.find(row=>row.t>=3.1)!
      expect(early.inhibited).toBe(false)
      expect(late.mode).toBe('Fault-latched')
      expect(late.reason).toBe(fault)
      check(`Fault ${fault}: drive current after latch (A)`,0,late.current,1e-12)
    }
    const coast=benchStep('re01',initialBench,{...request,fault:'Guard open'})
    const after=benchStep('re01',coast,request)
    expect(after.latch).toBe('Guard open')
    expect(after.current).toBe(0)
  })
})
