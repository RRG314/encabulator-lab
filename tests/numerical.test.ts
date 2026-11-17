import { writeFileSync } from 'node:fs'
import { afterAll, describe, expect, it } from 'vitest'
import { baseline, screening } from '../src/simulation/calculations'
import { integrate, radToRpm, rpmToRad } from '../src/simulation/numerics'
import { estimatePhase, syntheticPhase } from '../src/simulation/phase'
import { acPhase, drive, faults, flow, plant } from '../src/simulation/plant'
import { idealSpinup, rotor, torsion, unbalanceForce } from '../src/simulation/rotor'
import { temperature, thermal } from '../src/simulation/thermal'
import { responseAmplitude, vibration } from '../src/simulation/vibration'

const readings: {condition:string, expected:number, observed:number, absoluteError:number, tolerance:number, status:string}[] = []
function verify(condition:string, expected:number, observed:number, tolerance:number) {
  const absoluteError = Math.abs(expected-observed)
  readings.push({condition,expected,observed,absoluteError,tolerance,status:absoluteError <= tolerance?'PASS':'FAIL'})
  expect(absoluteError).toBeLessThanOrEqual(tolerance)
}

afterAll(() => {
  if (process.env.TE01_WRITE_NUMERICAL === '1') {
    writeFileSync(new URL('../public/models/numerical-validation.json',import.meta.url),
      JSON.stringify({revision:'0.1',basis:'Analytical solutions and deterministic synthetic reference cases',readings},null,2)+'\n')
  }
})

describe('rotation and numerical integration', () => {
  it('converts rpm and matches the analytic torque/drag ODE', () => {
    const torque=.16, inertia=.004, drag=.0005
    const sample=rotor({torque,inertia,drag,aero:0,load:0},12).at(-1)!
    verify('rpm to rad/s and back',1500,radToRpm(rpmToRad(1500)),1e-10)
    verify('12 s analytic spin-up (rpm), constant torque and linear drag',
      radToRpm(idealSpinup(12,torque,inertia,drag)),sample.rpm,1e-5)
    verify('Stationary zero input (rpm)',0,rotor({torque:0,inertia,drag,aero:0,load:0}).at(-1)!.rpm,1e-12)
  })

  it('converges at fourth order on a defined scalar ODE', () => {
    const solution = (dt:number) => integrate([1],1,dt,(_, [x])=>[-x]).at(-1)!.state[0]
    const coarse=Math.abs(Math.exp(-1)-solution(.2))
    const fine=Math.abs(Math.exp(-1)-solution(.1))
    verify('Step-refined exponential decay',Math.exp(-1),solution(.1),4e-7)
    expect(coarse/fine).toBeGreaterThan(14)
    expect(()=>integrate([0],1,-1,() => [0])).toThrow(/Time grid/)
  })

  it('scales radial force by speed squared and balances two free inertias', () => {
    verify('Unbalance force ratio for doubled speed',4,unbalanceForce(5e-6,2000)/unbalanceForce(5e-6,1000),1e-12)
    const model=torsion(.004,.009,3,.025,.16)
    verify('Coupling elastic frequency (Hz)',Math.sqrt(3*(1/.004+1/.009))/(2*Math.PI),model.fn,1e-12)
    verify('Total momentum at 2 s (kg·m²/s)',.32,model.points.at(-1)!.momentum,1e-9)
  })
})

describe('transverse and thermal response', () => {
  it('recovers natural frequency and damps the resonance peak', () => {
    const p={mass:.45,stiffness:15000,damping:22,rpm:1500,unbalance:5e-6}
    const reference=vibration(p)
    verify('Natural frequency (Hz)',Math.sqrt(15000/.45)/(2*Math.PI),reference.fn,1e-10)
    const w=Math.sqrt(15000/.45)
    expect(responseAmplitude(.45,15000,60,w,1)).toBeLessThan(responseAmplitude(.45,15000,22,w,1))
    verify('Vibration displacement at 1.1 s, half-step refinement (m)',
      vibration(p,1.1,.0005).time.at(-1)!.y,reference.time.at(-1)!.y,1e-8)
    verify('Zero excitation response (m)',0,vibration({...p,rpm:0}).time.at(-1)!.y,1e-14)
  })

  it('matches thermal transient, no-heat limit and equilibrium', () => {
    const rows=thermal(22,54,0.68,12,3)
    verify('Motor temperature at 300 s (°C)',temperature(300,22,22,54,.68,12),rows.at(-1)!.motor,1e-8)
    verify('Closed-form thermal equilibrium (°C)',22+12/.68,temperature(1e5,22,22,54,.68,12),1e-9)
    verify('Zero power thermal limit (°C)',22,thermal(22,54,.68,0,0).at(-1)!.motor,1e-10)
  })
})

describe('synchronous phase', () => {
  it('estimates the signed offset under seeded noise and rate changes', () => {
    for (const fs of [100,400,775]) {
      const run=syntheticPhase(fs,19,38,.2,false)
      verify(`Known phase offset 38 deg, ${fs} Hz sampling`,38,run.estimate!.phaseDeg,2)
      expect(run.estimate!.coherence).toBeGreaterThan(.97)
      expect(run).toEqual(syntheticPhase(fs,19,38,.2,false))
    }
    expect(syntheticPhase(400,20,38,.1,true).estimate).toBeNull()
    expect(estimatePhase([1,2],[1,2],100,50)).toBeNull()
    expect(estimatePhase(Array(800).fill(0),Array(800).fill(0),200,10)).toBeNull()
  })
})

describe('electric, fluid and integrated fault response', () => {
  it('balances conversion power and delivers the fan boundary condition', () => {
    const drivePoint=drive(24,130,.7,2,.05)
    verify('DC drive power balance (W)',drivePoint.busPower,
      drivePoint.converted+drivePoint.copperLoss+drivePoint.controllerLoss,1e-10)
    verify('Zero fan command (m³/s)',0,flow(0,.015,65,8e5,0,1e-6).q,1e-12)
    const circuit=acPhase(12,12,.025,50,0)
    verify('AC unity factor at calculated shunt capacitance',1,acPhase(12,12,.025,50,circuit.optimal).factor,1e-12)
  })

  it('tests sustained faults and numerical energy closure', () => {
    for (const fault of faults.slice(1)) {
      const points=plant(24,2000,.015,.7,fault)
      const early=points.find(p=>p.t>=2)!
      const event=points.find(p=>p.t>=3.02)!
      expect(early.inhibited).toBe(false)
      expect(event.inhibited).toBe(true)
      expect(event.phaseQualified).toBe(false)
      verify(`${fault} at 3.02 s: DC current after inhibit (A)`,0,event.current,1e-10)
      expect(points.at(-1)!.rpm).toBeLessThan(early.rpm)
    }
    const result=plant(24,2000,.015,.7,'None').at(-1)!
    verify('Integrated rotational energy audit at 10 s (J)',0,result.auditJ,1e-6)
    verify('Integrated speed, half timestep (rpm)',plant(24,2000,.015,.7,'None',.0025).at(-1)!.rpm,result.rpm,1e-3)
  })

  it('balances bearing reaction force and reproduces simple span displacement',()=>{
    const result=screening(baseline)
    verify('Vertical force balance (N)',baseline.forceN,result.left+result.right,1e-12)
    const inertia=Math.PI*baseline.diameterM**4/64
    verify('Centered static deflection (m)',baseline.forceN*baseline.spanM**3/(48*baseline.modulusPa*inertia),result.deflection,1e-12)
  })
})
