import { clamp, integrate, radToRpm, rpmToRad } from '../numerics'
import { defaultOptions, hosts, me01Simulation } from './plant'
import type { Options } from './plant'

export const installations = {
  dynamometer:{media:'Torque reaction stand', load:'Constant opposing torque with a low-speed smooth transition.'},
  pump:{media:'Liquid-side pump boundary', load:'Steady centrifugal similarity. Shaft torque grows as speed squared.'},
  compressor:{media:'Gas-side compressor boundary', load:'Linearized opposing torque around the nominal speed.'},
  generator:{media:'Electrical load-bank boundary', load:'Saturating opposing torque. Electrical conversion efficiency is unspecified.'},
  drivetrain:{media:'Reflected drivetrain boundary', load:'Increased reflected inertia and speed-dependent resisting torque.'},
  turbine:{media:'Passive test shaft', load:'Viscous shaft load. No active prime-mover torque.'},
} satisfies Record<Options['host'],{media:string;load:string}>

export function compareInstallation(host:Options['host'],rpm:number){
  const hostModel=hosts[host]
  const assumedInertia=.011*hostModel.j
  const request=rpmToRad(rpm)
  const base=integrate([0],9,.002,(_,state)=>{
    const w=state[0]
    const limit=Math.min(.47,.122*Math.max(0,(36-.122*w)/2.55))
    const torque=clamp(1.85*(request-w)*assumedInertia,0,limit)
    return [(torque-hostModel.load(w))/assumedInertia]
  },13).map(({t,state})=>({t,rpm:radToRpm(state[0])}))
  const options={...defaultOptions,host,rpm,regen:false}
  const nominal=me01Simulation(options)
  const alternative=me01Simulation({...options,pitch:8})
  return {base,nominal,alternative,assumedInertia}
}
