import type { SimulationId } from '../schemas/simulation'
import { rpmToRad } from './numerics'
import { automate, crankKinematics, pumpPoint, reduction } from './automation'
import type { MachineKey } from '../machines/profiles'
import { syntheticPhase } from './phase'
import { acPhase, drive, flow, plant } from './plant'
import type { Fault } from './plant'
import { rotor, torsion, unbalanceForce } from './rotor'
import { thermal } from './thermal'
import { vibration } from './vibration'

export interface Series { name: string, data: (number | null)[], color?: string }
export interface Chart { title:string, xLabel:string, unit:string, x:number[], series:Series[] }
export interface Study { charts:Chart[], readings: [string, string][], telemetry?: ReturnType<typeof plant>, note?:string }
const chart = (title:string, xLabel:string, unit:string, x:number[], ...series:Series[]): Chart => ({title,xLabel,unit,x,series})
const fmt = (n:number, units = '', precision = 2) => `${n.toFixed(precision)}${units ? ` ${units}` : ''}`
const series = (name:string,data:Series['data'],color?:string):Series => ({name,data,color})
const range = (max:number) => Array.from({length:121},(_,i) => max*i/120)

export function study(id:SimulationId, p:Record<string,number>, fault:Fault, dropout:boolean, machine:MachineKey='te01'):Study {
  switch (id) {
    case 'rotor': {
      const points = rotor({inertia:p.inertia,torque:p.torque,drag:p.drag,aero:p.aero*1e-6,load:p.load})
      const end = points.at(-1)!
      return {readings:[['Final speed',fmt(end.rpm,'rpm',0)],['Final acceleration',fmt(end.acceleration,'rad/s²')],
        ['Net torque',fmt(end.torque,'N·m',3)],['Drag loss',fmt(end.dissipatedPower,'W')]],
        charts:[chart('Angular velocity','Time (s)','rpm',points.map(v=>v.t),series('Shaft speed',points.map(v=>v.rpm))),
          chart('Torque and drag power','Time (s)','W',points.map(v=>v.t),series('Motor input',points.map(v=>v.inputPower)),
            series('Mechanical drag loss',points.map(v=>v.dissipatedPower),'#8ec8e1'))] }
    }
    case 'unbalance': {
      const speed=range(4000)
      const u=p.mass*p.radius*1e-6
      return {readings:[['Residual unbalance',fmt(p.mass*p.radius,'g·mm')],['Force amplitude',fmt(unbalanceForce(u,p.rpm),'N',3)],
        ['Angular velocity',fmt(rpmToRad(p.rpm),'rad/s')]],
        charts:[chart('Radial force amplitude','Speed (rpm)','N',speed,series('Unbalance force',speed.map(n=>unbalanceForce(u,n))))]}
    }
    case 'vibration': {
      const {fn,zeta,time,sweep}=vibration({mass:p.mass,stiffness:p.stiffness,damping:p.damping,rpm:p.rpm,unbalance:p.unbalance*1e-6})
      return {readings:[['Natural frequency',fmt(fn,'Hz')],['Damping ratio',fmt(zeta,'',3)],['Excitation',fmt(p.rpm/60,'Hz')]],
        charts:[chart('Transverse displacement','Time (s)','µm',time.map(v=>v.t),series('Displacement',time.map(v=>v.y*1e6))),
          chart('Transverse acceleration','Time (s)','m/s²',time.map(v=>v.t),series('Acceleration',time.map(v=>v.a))),
          chart('Steady-state unbalance response','Frequency (Hz)','µm',sweep.map(v=>v.f),series('Synchronous amplitude',sweep.map(v=>v.amplitude*1e6)))]}
    }
    case 'torsion': {
      const {fn,points}=torsion(p.j1,p.j2,p.stiffness,p.damping,p.torque)
      return {readings:[['Elastic mode',fmt(fn,'Hz')],['Peak transmitted torque',fmt(Math.max(...points.map(v=>Math.abs(v.transmitted))),'N·m',3)]],
        charts:[chart('Coupling torque','Time (s)','N·m',points.map(v=>v.t),series('Transmitted torque',points.map(v=>v.transmitted))),
          chart('Relative shaft twist','Time (s)','°',points.map(v=>v.t),series('Twist',points.map(v=>v.angle*180/Math.PI)))] }
    }
    case 'electrical': {
      const speed=range(4000)
      const model=(n:number)=>drive(p.voltage,rpmToRad(n),p.duty/100,p.resistance,p.kt)
      const points=speed.map(model)
      const end=model(p.rpm)
      return {readings:[['Winding current',fmt(end.current,'A')],['Electromagnetic torque',fmt(end.torque,'N·m',3)],
        ['DC input power',fmt(end.busPower,'W')],['Conversion power',fmt(end.converted,'W')]],
        charts:[chart('Electrical power budget','Speed (rpm)','W',speed,series('DC input',points.map(v=>v.busPower)),
          series('Mechanical conversion',points.map(v=>v.converted),'#8ec8e1'),series('Copper + drive losses',points.map(v=>v.copperLoss+v.controllerLoss),'#9ec0a2'))]}
    }
    case 'thermal': {
      const conductance=p.conductance+0.6*p.fan/100
      const points=thermal(p.ambient,p.capacity,conductance,p.motor,p.controller)
      return {readings:[['Motor time constant',fmt(p.capacity/conductance,'s')],['Motor equilibrium',fmt(p.ambient+p.motor/conductance,'°C')],
        ['Controller equilibrium',fmt(p.ambient+p.controller/(conductance*.7),'°C')]],
        charts:[chart('Estimated node temperatures','Time (s)','°C',points.map(v=>v.t),series('Motor node',points.map(v=>v.motor)),
          series('Controller node',points.map(v=>v.controller),'#8ec8e1'))]}
    }
    case 'phase': {
      const {points,estimate}=syntheticPhase(p.sample,p.freq,p.offset,p.noise,dropout)
      const trace=dropout ? points : points.filter(v=>v.t<=Math.max(.25,4/p.freq))
      return {readings:[['Estimated Δφ',estimate ? fmt(estimate.phaseDeg,'°') : 'Unavailable'],
        ['Coherence γ²',estimate ? fmt(estimate.coherence,'',3) : 'Unavailable'],['Accepted windows',String(estimate?.windows ?? 0)],
        ['Signal qualification',estimate?.quality ?? 'Insufficient signal']],
        charts:[chart('Paired waveform excerpt','Time (s)','normalized',trace.map(v=>v.t),series('Reference X',trace.map(v=>v.x)),
          series('Response Y',trace.map(v=>v.y),'#8ec8e1'))],
        note: `Known tone ${p.freq} Hz. Rectangular capture of 4 s, 50% overlap, 6 cycles per Hann window. No metrological confidence interval has been assigned.`}
    }
    case 'ac': {
      const model=(cap:number)=>acPhase(p.voltage,p.resistance,p.inductance/1000,p.freq,cap*1e-6)
      const c=range(200)
      const selected=model(p.capacitance)
      return {readings:[['Real power',fmt(selected.real,'W')],['Signed reactive power',fmt(selected.vars,'var')],
        ['Source phase angle',fmt(selected.angleDeg,'°')],['Unity-factor capacitance',fmt(selected.optimal*1e6,'µF')]],
        charts:[chart('Reactive power versus capacitance','Shunt capacitance (µF)','var',c,series('Source reactive power',c.map(v=>model(v).vars)))]}
    }
    case 'flow': {
      const model=(duty:number)=>flow(duty,p.freeFlow/1000,p.head,p.restriction*1e6,rpmToRad(p.rpm),1.1e-6)
      const duty=range(100)
      const selected=model(p.duty/100)
      return {readings:[['Flow rate',fmt(selected.q*1000,'L/s')],['Pressure rise',fmt(selected.pressure,'Pa')],
        ['Air power',fmt(selected.fluidPower,'W',3)],['Rotor drag torque',fmt(selected.rotorDrag,'N·m',3)]],
        charts:[chart('Operating flow','Fan command (%)','L/s',duty,series('System flow',duty.map(v=>model(v/100).q*1000))),
          chart('Operating pressure','Fan command (%)','Pa',duty,series('Pressure rise',duty.map(v=>model(v/100).pressure)))]}
    }
    case 'integrated': {
      const re=machine==='re01'
      const retro=re?automate({run:true,rpm:p.rpm,voltage:p.voltage,fan:p.fan/100,fault,pressureHeadKPa:p.head,loadNm:p.load}):null
      const points=retro??plant(p.voltage,p.rpm,p.load,p.fan/100,fault)
      const last=points.at(-1)!
      return {telemetry:points,readings:[['End state',last.inhibited ? 'Drive inhibited' : 'Drive enabled'],['End speed',fmt(last.rpm,'rpm',0)],
        ['Motor temperature',fmt(last.motor,'°C')],['Energy residual',fmt(last.auditJ,'J',6)],
        ...(retro?[["Water delivery",fmt(retro.at(-1)!.waterFlow*60000,'L/min',3)] as [string,string]]:[])],
        charts:[chart('Shaft speed','Time (s)','rpm',points.map(v=>v.t),series('Calculated rotor speed',points.map(v=>v.rpm))),
          chart('DC current','Time (s)','A',points.map(v=>v.t),series('Bus current',points.map(v=>v.current))),
          chart('Thermal response','Time (s)','°C',points.map(v=>v.t),series('Motor',points.map(v=>v.motor)),
            series('Housing/controller',points.map(v=>v.controller),'#427a96')),
          ...(retro?[chart('Water delivery','Time (s)','L/min',retro.map(v=>v.t),series('Cycle average',retro.map(v=>v.waterFlow*60000)))]:[])],
        note:'Fault injection begins at simulation time 3 s. The energy residual compares integrated DC input, dissipated and exported work, and stored rotational energy.'}
    }
    case 'crank': {
      const omega=rpmToRad(p.rpm)/reduction
      const cycle=range(2*Math.PI)
      const time=cycle.map(angle=>angle/omega)
      const samples=cycle.map(angle=>crankKinematics(angle,omega))
      const pump=pumpPoint(rpmToRad(p.rpm),p.head)
      return {readings:[['Nominal stroke','24 mm'],['Flow',fmt(pump.q*60000,'L/min',3)],['Delivery pressure',fmt(pump.pressure/1000,'kPa')],
        ['Fluid power',fmt(pump.work,'W',4)],['Pressure load',fmt(pump.pistonForceN,'N',3)]],
        charts:[chart('Crosshead stroke','Time (s)','mm',time,series('Displacement',samples.map(point=>point.positionMm))),
          chart('Crosshead velocity','Time (s)','mm/s',time,series('Velocity',samples.map(point=>point.velocityMmS))),
          chart('Crosshead acceleration','Time (s)','mm/s²',time,series('Acceleration',samples.map(point=>point.accelerationMmS2)))]}
    }
    case 'winding': {
      const tau=p.l/1000/p.r
      const settled=(p.voltage-.112*rpmToRad(p.rpm))/p.r
      const t=range(6*tau)
      return {readings:[['Time constant',fmt(tau*1000,'ms')],['Steady winding current',fmt(settled,'A')],
        ['Steady winding loss',fmt(settled**2*p.r,'W')]],
        charts:[chart('Inductive current response','Time (ms)','A',t.map(value=>value*1000),
          series('Equivalent winding current',t.map(value=>-settled*Math.expm1(-value/tau))))]}
    }
  }
}
