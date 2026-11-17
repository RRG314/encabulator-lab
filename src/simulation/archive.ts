import type { ArchiveStudy } from '../machines/archive'
import type { Chart } from './studies'

type Parameter = { name:string; unit:string; min:number; max:number; step:number; initial:number }
type Study = { title:string; equation:string; assumptions:string; inputs:Parameter[]; stages:string[] }
const input=(name:string,unit:string,min:number,max:number,step:number,initial:number):Parameter=>({name,unit,min,max,step,initial})

export const archiveStudies:Record<ArchiveStudy,Study> = {
  reactive:{title:'Signed reactive-current measurement', equation:'X = 2πfL − 1/(2πfC); Iq = −V X/(R² + X²)',
    assumptions:'Series RLC equivalent. f in Hz, L = 0.040 H, C = 160 μF, R in Ω, V in V RMS and Iq in A RMS. The reference spindle uses a four-pole speed with 6% slip and first-order run-up. Its mechanical rating remains open.',
    inputs:[input('Frequency','Hz',40,110,1,60),input('Series resistance','Ω',3,36,1,12),input('Excitation','V RMS',2,24,1,12)],
    stages:['Isolated supply','Series RLC','Current split','Dual indications']},
  charge:{title:'Charge and controlled discharge', equation:'Vc(t + Δt) = Vs + (Vc(t) − Vs) exp(−Δt/RC)',
    assumptions:'C = 0.022 F. Adjustable charging resistance R in Ω and source voltage Vs in V. Loss of command sets Vs to 0 V through a 47 Ω discharge path. No historical pinout or equipment rating is implied.',
    inputs:[input('Source voltage','V',2,24,1,12),input('Charge resistance','Ω',10,100,5,45)],
    stages:['Input module','Lid relay','Charge element','Discharge path']},
  resonators:{title:'Dual pickup response', equation:'H(f) = ∏[1/√((1 − (f/fn)²)² + (f/(Qfn))²)]',
    assumptions:'Two independently normalized linear second-order stages. f and fn in kHz, Q dimensionless. The second stage tunes 8% above the first. Frequency sweeps from 0.15 fn to 2 fn over the assay.',
    inputs:[input('Primary tuning','kHz',5,60,1,20),input('Quality factor','1',1,10,.5,3)],
    stages:['Input ports','First spurving resonator','Second spurving resonator','Output stage']},
  magnetic:{title:'Periodic magnetic shaft coupling', equation:'J dω₂/dt = T̂ sin(p(θ₁ − θ₂)) − bω₂ − Tload tanh(ω₂)',
    assumptions:'θ in rad, ω in rad/s and torque in N·m. Four-pole spatial harmonic p = 4, output inertia J = 0.020 kg·m² and b = 0.012 N·m·s/rad. Driver ramps for 1 s. The harmonic coupling is an analogue of the pictured carrier train.',
    inputs:[input('Drive speed','rpm',10,115,5,60),input('Coupling peak','N·m',.24,1.2,.02,.72),input('External torque','N·m',0,.35,.01,.08)],
    stages:['Input shaft','Periodic field','Carrier train','Indicator stack']},
  hydraulic:{title:'Coaxial fluid-coupling response', equation:'J dω₂/dt = K(ω₁ − ω₂) − bω₂ − Tload tanh(ω₂)',
    assumptions:'Linear slip approximation for an impeller and turbine. Angular speeds in rad/s, J = 0.048 kg·m², b = 0.009 N·m·s/rad, load in N·m. K is a lumped coefficient in N·m·s/rad. Fluid temperature and torque multiplication are outside the model.',
    inputs:[input('Input drive speed','rpm',180,1600,20,720),input('Slip coefficient','N·m·s/rad',.025,.2,.005,.08),input('External torque','N·m',0,1.6,.05,.55)],
    stages:['Drive input','Impeller','Driven turbine','Output shaft']},
  routing:{title:'Wide-area path transfer', equation:'D = min(T, Cactive); L = T − D',
    assumptions:'Delivered traffic D, unsatisfied demand L, offered traffic T and active capacity C in Mbit/s. Path health uses a provisioned detection timer. All links and traffic are local numerical states.',
    inputs:[input('Offered traffic','Mbit/s',5,150,5,65),input('Detection delay','s',.1,2,.1,.6),input('Standby capacity','Mbit/s',15,140,5,60)],
    stages:['Offered traffic','Path policy','Primary / standby','Delivery estimate']},
  markov:{title:'Layer occupancy and recirculation', equation:'p[k + 1] = p[k]P; Σⱼ Pᵢⱼ = 1',
    assumptions:'p is dimensionless occupancy. P advances a fraction α through three intermediate transitions and returns a fraction β of output occupancy to the inlet. A retained state keeps the remaining occupancy. A fault inhibits return.',
    inputs:[input('Advance fraction','1',.05,1,.05,.45),input('Return fraction','1',0,1,.05,.3)],
    stages:['Inlet occupancy','First processing state','Second processing state','Output and return']},
  interlock:{title:'Supervisory sensor freshness', equation:'dy/dt = (u − y)/τ; u = r if age ≤ amax, otherwise 0',
    assumptions:'Normalized command r and process y. Model τ = 0.85 s. Fresh readings arrive every 0.1 s. A selected sensor interruption lasts from 4 s to 7 s. The output transitions to 0 while readings are stale.',
    inputs:[input('Process demand','1',.1,1,.05,.7),input('Freshness window','s',.1,1.5,.05,.35)],
    stages:['Process sensor','Freshness evaluation','Command gate','First-order process']},
}

export type ArchiveFrame = {time:number; values:number[]; status:string; rpm?:number; shaftPhaseRad?:number; inputAngleRad?:number}
const channelMeta:Record<ArchiveStudy,{title:string;unit:string;names:string[]}> = {
  reactive:{title:'Current components',unit:'A RMS',names:['In-phase current','Quadrature current']},
  charge:{title:'Charge element voltage',unit:'V',names:['Measured voltage','Source command']},
  resonators:{title:'Cascaded gain',unit:'V/V',names:['Dual-stage response']},
  magnetic:{title:'Shaft speeds',unit:'rpm',names:['Drive shaft','Carrier shaft']},
  hydraulic:{title:'Input and turbine shaft speeds',unit:'rpm',names:['Drive shaft','Turbine shaft']},
  routing:{title:'Delivered and offered traffic',unit:'Mbit/s',names:['Delivered','Offered']},
  markov:{title:'State occupancy',unit:'1',names:['Inlet','First state','Second state','Output']},
  interlock:{title:'Process tracking',unit:'1',names:['Process state','Gated command']},
}

export function runArchiveStudy(study:ArchiveStudy, parameters:number[], fault=false) {
  const [a,b,c]=archiveStudies[study].inputs.map(({min,max,initial},i)=>
    Number.isFinite(parameters[i])?Math.max(min,Math.min(max,parameters[i])):initial)
  const frames:ArchiveFrame[]=[]
  let voltage=0, process=0, angle=0, inputAngle=0, speed=0, lastSensor=0
  let p=[1,0,0,0]
  for(let i=0;i<=5000;i++){
    const t=i/500, dt=.002
    const failed=fault&&t>=4&&t<7
    const live=t<9&&!failed
    const status=t>=9?'Controlled shutdown':failed?'Disturbance interval':t<1?'Initialization':'Operating'
    let values:number[]
    let rpm:number|undefined
    let shaftPhaseRad:number|undefined
    let drivePhase:number|undefined
    switch(study){
      case 'reactive':{
        const w=2*Math.PI*a, x=w*.04-1/(w*160e-6), v=live?c*(1-Math.exp(-t/.28)):0
        values=[v*b/(b*b+x*x),-v*x/(b*b+x*x)]
        speed+=(Number(live)*a*30*.94-speed)*(1-Math.exp(-dt/.65))
        rpm=speed;angle+=rpm*Math.PI/30*dt;shaftPhaseRad=angle
        break
      }
      case 'charge':{
        const source=live?a:0
        values=[voltage,source]
        voltage=source+(voltage-source)*Math.exp(-dt/((live?b:47)*.022))
        break
      }
      case 'resonators':{
        const f=a*(.15+1.85*t/10)
        const gain=(stage:number)=>1/Math.hypot(1-(f/stage)**2,f/(b*stage))
        values=[live?gain(a)*gain(a*1.08):0]
        break
      }
      case 'magnetic':
      case 'hydraulic':{
        const drive=(Math.PI/30)*a*Math.min(1,t)*Number(t<9)
        values=[drive*30/Math.PI,speed*30/Math.PI]
        rpm=speed*30/Math.PI;shaftPhaseRad=angle
        drivePhase=inputAngle
        const magnetic=study==='magnetic'
        const coupling=magnetic?b*Math.sin(4*(inputAngle-angle)):b*(drive-speed)
        const torque=coupling-(magnetic?.012:.009)*speed-(c+(failed?(magnetic?.22:.8):0))*Math.tanh(speed)
        speed+=torque/(magnetic?.020:.048)*dt
        angle+=speed*dt
        inputAngle+=drive*dt
        break
      }
      case 'routing':{
        const route=failed?(t<4+b?0:c):100
        const demand=t<9?a:0
        values=[Math.min(demand,route),demand]
        break
      }
      case 'markov':{
        if(i>0&&i%250===0&&t<9) {
          const back=failed?0:b
          p=[(1-a)*p[0]+back*p[3],a*p[0]+(1-a)*p[1],a*p[1]+(1-a)*p[2],a*p[2]+(1-back)*p[3]]
        }
        values=p
        break
      }
      case 'interlock':{
        if(i%50===0&&!failed)lastSensor=t
        const permitted=t-lastSensor<=b
        const command=t<9&&permitted?a:0
        values=[process,command]
        process=command+(process-command)*Math.exp(-dt/.85)
        break
      }
    }
    if(i%25===0)frames.push({time:t,values,status,rpm,shaftPhaseRad,inputAngleRad:drivePhase})
  }
  const meta=channelMeta[study]
  const colors=['#155d89','#ae4e1c','#2a7440','#675396']
  const chart:Chart={title:meta.title,unit:meta.unit,xLabel:'Time (s)',x:frames.map(f=>f.time),
    series:meta.names.map((name,j)=>({name,color:colors[j],data:frames.map(f=>f.values[j])}))}
  return {frames,chart,names:meta.names,unit:meta.unit}
}
