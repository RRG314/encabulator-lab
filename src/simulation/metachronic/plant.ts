import { clamp, integrate, radToRpm, rpmToRad } from '../numerics'
import { flow } from '../plant'
import { entropyProduction, magneticLoss, scheduledGain } from './physics'

export const hosts={
  dynamometer:{label:'Dynamometer · constant torque', j:1, load:(w:number)=>.043*Math.tanh(w/2)},
  pump:{label:'Centrifugal pump · quadratic load', j:1.08, load:(w:number)=>2.8e-6*w*Math.abs(w)},
  compressor:{label:'Compressor · linearized load', j:1.10, load:(w:number)=>.035*Math.tanh(w/2)+.00058*w},
  generator:{label:'Generator · bounded power sink', j:1.14, load:(w:number)=>.17*Math.tanh(w/2)/(1+Math.abs(w)/250)},
  drivetrain:{label:'Drivetrain · reflected inertia', j:1.58, load:(w:number)=>.028*Math.tanh(w/2)+.00023*w},
  turbine:{label:'Turbine test shaft · passive sink', j:1.23, load:(w:number)=>.00115*w},
} as const
export const dynamicFaults=['None','Guard open','Shaft misalignment','Rotor imbalance','Bearing degradation','Actuator saturation',
  'Cooling failure','Sensor failure','Phase synchronization loss','Electrical overcurrent','Thermal overload',
  'Torsional displacement','Flow restriction','Controller instability'] as const
type Host=keyof typeof hosts
export type MeFault=typeof dynamicFaults[number]

export type Options={
  rpm:number, torque:number, stiffness:number, damping:number, gain:number, pitch:number, imbalance:number,
  throttle:number, head:number, ambient:number, fan:number, load:number, coupling:number, torsion:number,
  regen:boolean, host:Host, fault:MeFault,
}
export const defaultOptions:Options={rpm:1450,torque:.47,stiffness:32000,damping:27,gain:1.2,pitch:14,imbalance:9,
  throttle:.68,head:12,ambient:22,fan:.72,load:.023,coupling:5.4,torsion:.065,regen:true,host:'dynamometer',fault:'None'}
const J1=.008,J2=.011,V=36, Kt=.122, R=2.55, C=.038, RAD=Math.PI/180
const trips:Partial<Record<MeFault,string>>={'Guard open':'Guard chain open','Sensor failure':'Telemetry quality gate',
  'Phase synchronization loss':'Phase gate invalid','Electrical overcurrent':'Drive inhibit','Thermal overload':'Thermal trip',
  'Torsional displacement':'Coupling travel limit','Controller instability':'Gain watchdog'}

export function me01Simulation(options:Options,dt=.002,end=9) {
  const host=hosts[options.host], j2=J2*host.j
  const sampleInterval=Math.max(1,Math.round(.025/dt))
  const evaluate=(t:number,y:number[])=>{
    const [w1,w2,phase,qy,qz,vy,vz,motor,bearing,beta,dcEnergy]=y
    const active=t>=3?options.fault:'None'
    const broken=trips[active]
    const regen=t>=6&&options.regen&&!broken
    const request=broken?0:options.rpm*(regen?.52:1)
    const coupling=options.coupling*phase+options.torsion*(w1-w2)
    const drag1=.001*w1
    const valve=active==='Flow restriction'?.25*options.throttle:options.throttle
    const coolant=flow(active==='Cooling failure'?0:options.fan,.032,120,360000,0,0).q
    const loopFlow=.000009*valve*Math.sqrt(Math.max(0,options.head/12))*clamp(Math.abs(w2)/rpmToRad(options.rpm),0,1.15)
    const mhdDp=magneticLoss(1.4,.18,.058,loopFlow/.00011)
    const hydraulic=(options.head*1000+mhdDp)*loopFlow
    const aero=(1.9e-6+5.4e-6*Math.sin(beta)**2)*w2*Math.abs(w2)
    const external=host.load(w2)+(options.load+hydraulic/Math.max(10,Math.abs(w2)))*Math.tanh(w2/2)
    const drag2=aero+external
    const positiveLimit=Math.min(options.torque,Kt*Math.max(0,(V-Kt*Math.abs(w1))/R))
    const requested=1.85*(rpmToRad(request)-w1)*(J1+j2)+coupling+drag1
    const torque=broken?0:clamp(requested,regen?-.28:0,positiveLimit)
    const mech=torque*w1
    const copper=(torque/Kt)**2*R
    const recovered=Math.max(0,-mech-copper)
    const room=Math.max(0,.5*C*39**2-dcEnergy)
    const charge=Math.min(recovered,room/0.02)
    const dump=recovered-charge
    const driveIn=Math.max(0,mech+copper)
    const U=options.imbalance*1e-6*(active==='Rotor imbalance'?3.1:1)
    const amp=U*w2*w2+(active==='Shaft misalignment'?2.8:0)
    const thermalExpansion=12e-6*.13*(bearing-options.ambient)
    const k=options.stiffness*(active==='Bearing degradation'?.55:1)*clamp(1+.006*thermalExpansion*1e6,.75,1.2)
    const c=options.damping*(active==='Bearing degradation'?.65:1)
    const gain=broken?0:scheduledGain(Math.max(0,(motor-bearing)/60),options.gain)
    const fMax=active==='Actuator saturation'?.65:5
    const fy=clamp(-gain*(3100*qy+8*vy),-fMax,fMax),fz=clamp(-gain*(3100*qz+8*vz),-fMax,fMax)
    const qa=Math.abs(fy*vy)+Math.abs(fz*vz)+(gain>0?.3:0)
    const cooling=(.55+34*coolant+4000*loopFlow)*(motor-options.ambient)
    const conduct=.52*(motor-bearing)
    const betaRate=clamp((options.pitch*RAD-beta)*2,-.23,.23)
    return { active, broken, regen, request, coupling, drag1, drag2, torque, mech, copper, charge,dump,driveIn,fy,fz,amp,k,c,qa,
      betaRate,cooling,conduct,thermalExpansion,loopFlow,mhdDp,coolant,hostTorque:external,hydraulic,
      entropy:entropyProduction(Math.max(0,conduct),motor+273.15,bearing+273.15)}
  }
  const initial=[0,0,0,0,0,0,0,options.ambient,options.ambient,8*RAD,.5*C*V*V,0,0,0]
  const points=integrate(initial,end,dt,(t,y)=>{
    const [w1,w2,,qy,qz,vy,vz]=y
    const v=evaluate(t,y)
    const imbalanceAngle=y[13]
    return [(v.torque-v.coupling-v.drag1)/J1,(v.coupling-v.drag2)/j2,w1-w2,vy,vz,
      (v.amp*Math.cos(imbalanceAngle)+v.fy-v.k*qy-v.c*vy)/1.42,
      (v.amp*Math.sin(imbalanceAngle)+v.fz-1.2*v.k*qz-v.c*vz)/1.42,
      (v.copper+.46*v.drag1*w1-v.cooling-v.conduct)/118,(v.conduct+.11*v.drag2*w2-(.46+20*v.coolant)*(y[8]-options.ambient))/93,
      v.betaRate,v.charge,v.driveIn, v.copper+v.dump+v.drag1*w1+v.drag2*w2+options.torsion*(w1-w2)**2,w2]
  },sampleInterval)
  return points.map(({t,state:y})=>{
    const v=evaluate(t,y)
    const [w1,w2,phase,qy,qz,,,,,beta,dcEnergy,input,dissipated,phase2]=y
    const stored=.5*J1*w1*w1+.5*j2*w2*w2+.5*options.coupling*phase*phase+dcEnergy-initial[10]
    return {t, rpm:radToRpm(w1),secondaryRpm:radToRpm(w2),phaseRad:phase,
      pitch:beta/RAD,phase2,torque:v.coupling,pressure:options.head*1000+v.mhdDp,flow:v.loopFlow,
      motor:y[7],bearing:y[8],cooling:v.coolant,entropy:v.entropy,
      vibration:Math.hypot(qy,qz)*1e6,actuator:Math.hypot(v.fy,v.fz),busV:Math.sqrt(2*dcEnergy/C),
      busPower:v.driveIn+v.qa,regenW:v.charge,current:v.driveIn/V,audit:input-stored-dissipated,
      clearanceMicrons:92-v.thermalExpansion*1e6, mode:v.broken?'Fault-latched':v.active!=='None'?'Degraded':v.regen?'Regeneration':'Motoring',
      fault:v.broken || (v.active==='None'?'':v.active)}
  })
}
