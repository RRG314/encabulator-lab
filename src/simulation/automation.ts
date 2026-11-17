import { clamp, radToRpm, rpmToRad } from './numerics'
import { drive, flow } from './plant'
import type { Fault } from './plant'
import type { MachineKey } from '../machines/profiles'

export const benchProfiles = {
  te01: {inertia:.002, viscous:.00024, aero:1.1e-6, resistance:2.2, kt:.05, limit:4,
    capacity:54, cooling:.35, freeFlow:.015, head:65, duct:800000, speedLimit:3100, load:.014, mass:.45, stiffness:15000, damping:22, unbalance:1.5e-6},
  re01: {inertia:.0056, viscous:.0007, aero:1.6e-6, resistance:3.1, kt:.112, limit:5,
    capacity:140, cooling:.68, freeFlow:.027, head:95, duct:315000, speedLimit:2250, load:.035, mass:1.45, stiffness:33000, damping:35, unbalance:6e-6},
  me01: {inertia:.019, viscous:.001, aero:2.0e-6, resistance:2.55, kt:.122, limit:5,
    capacity:118, cooling:.55, freeFlow:.032, head:120, duct:360000, speedLimit:2250, load:.023, mass:1.42, stiffness:32000, damping:27, unbalance:9e-6},
}
export interface BenchState {
  t:number, w:number, motor:number, housing:number, inlet:number, curtailed:number,
  current:number, torque:number, waterFlow:number, pressure:number, heat:number,
  latch:string, mode:'Standby'|'Accelerating'|'Tracking'|'Coasting'|'Fault-latched'
}
export interface BenchCommand {
  run:boolean, rpm:number, voltage:number, fan:number, fault:Fault, pressureHeadKPa:number, loadNm:number
}
export const initialBench: BenchState = {t:0,w:0,motor:22,housing:22,inlet:0,curtailed:0,current:0,
  torque:0,waterFlow:0,pressure:0,heat:0,latch:'',mode:'Standby'}
export const crankRadiusMm=12
export const connectingRodMm=68
export const reduction=20

export function crankPosition(angle:number, r=crankRadiusMm, l=connectingRodMm) {
  const pinX = r*Math.cos(angle)
  const pinY = r*Math.sin(angle)
  const distance = Math.sqrt(l*l-pinY*pinY)
  return {pinX,pinY, sliderX:pinX+distance, armAngle:Math.atan2(-pinY,distance)}
}
export function crankKinematics(angle:number, angularRate:number, r=crankRadiusMm, l=connectingRodMm) {
  const {sliderX}=crankPosition(angle,r,l)
  const s=Math.sin(angle), c=Math.cos(angle), root=Math.sqrt(l*l-r*r*s*s)
  const derivative=-r*s-r*r*s*c/root
  const second=-r*c-r*r*(c*c-s*s)/root-r**4*s*s*c*c/root**3
  return {positionMm:sliderX-l, velocityMmS:derivative*angularRate, accelerationMmS2:second*angularRate**2}
}

export function pumpPoint(w:number, headKPa:number) {
  const pistonArea = Math.PI*.009**2/4
  const idealDisplacement = pistonArea*(crankRadiusMm*2/1000)
  const rate = Math.max(0,w)/(2*Math.PI*reduction)
  const q=idealDisplacement*rate*.8
  const v=q/(Math.PI*.008**2/4)
  const pressure = headKPa*1000 + (.04*.7/.008+4)*997*v*v/2
  const work = pressure*q
  return {q,pressure,work,torque:w>1e-8 ? work/(.62*w) : 0,pistonForceN:pressure*pistonArea}
}

export function benchStep(machine:MachineKey, state:BenchState, c:BenchCommand, dt=.005):BenchState {
  const d=benchProfiles[machine]
  const rpm=radToRpm(state.w)
  const latch=state.latch || (c.fault==='None' ? '' : c.fault) || (rpm>d.speedLimit?'Overspeed': state.motor>68?'Overtemperature':'')
  const powered=c.run && !latch
  const coolant=flow(c.fan,d.freeFlow,d.head,d.duct,0,d.aero)
  const pump=machine==='re01' ? pumpPoint(state.w,c.pressureHeadKPa) : {q:0,pressure:0,work:0,torque:0}
  const resist=d.viscous*state.w+d.aero*state.w**2+(c.loadNm+pump.torque)*Math.tanh(state.w/3)
  const nowTarget=rpmToRad(clamp(c.rpm,0,d.speedLimit))
  const requested=clamp((resist+d.inertia*(nowTarget-state.w)*2.6)/d.kt,0,d.limit)
  const duty=powered ? (d.kt*state.w+d.resistance*requested)/Math.max(c.voltage,1) : 0
  const elec=drive(c.voltage,state.w,duty,d.resistance,d.kt,d.limit)
  const w=Math.max(0,state.w+(elec.torque-resist)*dt/d.inertia)
  const motor=state.motor+dt*(elec.copperLoss+.33*resist*state.w-(d.cooling+24*coolant.q)*(state.motor-22)-.27*(state.motor-state.housing))/d.capacity
  const housing=state.housing+dt*(elec.controllerLoss+.27*(state.motor-state.housing)-(.35+21*coolant.q)*(state.housing-22))/(d.capacity*.7)
  const nextPump=machine==='re01'?pumpPoint(w,c.pressureHeadKPa):pump
  return {t:state.t+dt,w,motor,housing,latch,current:elec.busCurrent,torque:elec.torque,waterFlow:nextPump.q,pressure:nextPump.pressure,
    heat:elec.copperLoss+elec.controllerLoss,
    inlet:state.inlet+dt*elec.busPower,curtailed:state.curtailed+dt*(elec.copperLoss+elec.controllerLoss+resist*state.w),
    mode:latch?'Fault-latched':powered?(Math.abs(rpm-c.rpm)<30?'Tracking':'Accelerating'):rpm>2?'Coasting':'Standby'}
}
export function benchReading(machine:MachineKey,state:BenchState, command:BenchCommand) {
  const d=benchProfiles[machine]
  const w=state.w
  return {t:state.t, rpm:radToRpm(w), voltage:command.voltage,current:state.current,
    motor:state.motor,controller:state.housing,flow:flow(command.fan,d.freeFlow,d.head,d.duct,w,d.aero).q,
    waterFlow:state.waterFlow,pressure:state.pressure,torque:state.torque,mode:state.mode,
    vibrationUm:1e6*d.unbalance*w*w/Math.hypot(d.stiffness-d.mass*w*w,d.damping*w),
    phaseQualified:!state.latch,inhibited:!!state.latch,reason:state.latch,
    auditJ:state.inlet-state.curtailed-.5*d.inertia*w*w}
}
export function automate(command:BenchCommand, machine:MachineKey='re01', dt=.005) {
  let state=initialBench
  const steps=Math.round(10/dt)
  const rows=[benchReading(machine,state,command)]
  for (let i=0;i<steps;i++) {
    state=benchStep(machine,state,{...command,fault:i*dt>=3-1e-8?command.fault:'None'},dt)
    if ((i+1)%Math.max(1,Math.round(.025/dt))===0 || i===steps-1) rows.push(benchReading(machine,state,command))
  }
  return rows
}
