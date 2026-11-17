import { clamp, integrate } from '../numerics'

export const MU0=4e-7*Math.PI
export const magneticLoss=(sigma:number,b:number,length:number,u:number,closure=.65)=>closure*sigma*b*b*length*u
export const entropyProduction=(heat:number,hot:number,cold:number)=>heat*(1/cold-1/hot)
export const scheduledGain=(growth:number,limit:number)=>clamp(growth+0.65,0,limit)
export function nextHysteresis(on:boolean,t:number,elapsed:number,high:number,low:number,dwell:number) {
  if(elapsed<dwell)return on
  return on ? t>low : t>=high
}
export const dynamicStiffness=(mass:number,c:number,k:number,w:number)=>Math.hypot(k-mass*w*w,c*w)
export const complexTone=(y:number[],dt:number,frequency:number)=>y.reduce(([re,im],v,i)=>
  [re+v*Math.cos(2*Math.PI*frequency*i*dt),im-v*Math.sin(2*Math.PI*frequency*i*dt)],[0,0])

type Study = { title:string,xLabel:string,unit:string,x:number[],series:{name:string,data:number[]}[],metrics:[string,string][] }
const sample=(max:number,count=180)=>Array.from({length:count+1},(_,i)=>i*max/count)
const format=(value:number,unit:string)=>`${Number(value.toPrecision(4))} ${unit}`
const s=(name:string,data:number[])=>({name,data})
const result=(title:string,xLabel:string,unit:string,x:number[],series:Study['series'],metrics:Study['metrics']=[]):Study=>
  ({title,xLabel,unit,x,series,metrics})
const w=(f:number)=>2*Math.PI*f
type Q=[number,number,number,number]
function multiply(a:Q,b:Q):Q {
  const [s,x,y,z]=a,[t,u,v,w]=b
  return [s*t-x*u-y*v-z*w,s*u+x*t+y*w-z*v,s*v-x*w+y*t+z*u,s*w+x*v-y*u+z*t]
}
export function commutatorAngle(x:number,y:number) {
  const a:Q=[Math.cos(x/2),Math.sin(x/2),0,0],b:Q=[Math.cos(y/2),0,Math.sin(y/2),0]
  const ai:Q=[a[0],-a[1],0,0],bi:Q=[b[0],0,-b[2],0]
  const c=multiply(multiply(multiply(a,b),ai),bi)
  return 2*Math.atan2(Math.hypot(c[1],c[2],c[3]),Math.abs(c[0]))
}

export const controls:Record<number,{label:string,min:number,max:number,initial:number,step:number,unit:string}> = {
  40:{label:'Field gradient',min:0,max:25,initial:8,step:.5,unit:'T/m'},
  41:{label:'Transverse field',min:0,max:.45,initial:.18,step:.01,unit:'T'},
  42:{label:'Coupling stiffness',min:25,max:190,initial:85,step:5,unit:'N/m'},
  43:{label:'Applied field',min:0,max:.3,initial:.10,step:.005,unit:'T'},
  44:{label:'Forward active gain',min:.3,max:2.5,initial:1.6,step:.05,unit:'ratio'},
  45:{label:'On threshold',min:32,max:49,initial:40,step:.5,unit:'°C'},
  46:{label:'Tilt damping',min:.02,max:.36,initial:.11,step:.01,unit:'N·m·s/rad'},
  47:{label:'Current amplitude',min:0,max:3,initial:1.7,step:.05,unit:'A'},
  48:{label:'First reference frequency',min:.3,max:3,initial:.75,step:.05,unit:'Hz'},
  49:{label:'Second-axis stiffness',min:550,max:4000,initial:1700,step:50,unit:'N/m'},
  50:{label:'Signal phase',min:-180,max:180,initial:55,step:2,unit:'°'},
  51:{label:'Diffusion D',min:0,max:.55,initial:.12,step:.01,unit:'s⁻¹'},
  52:{label:'Circuit loss coefficient',min:.2,max:6,initial:2.2,step:.1,unit:'ratio'},
  53:{label:'Branch parameter μ',min:-.35,max:.9,initial:.25,step:.01,unit:'normalized'},
  54:{label:'Hot-side temperature',min:300,max:410,initial:348,step:1,unit:'K'},
  55:{label:'Loop half-angle',min:0,max:55,initial:22,step:1,unit:'°'},
  56:{label:'First rotation magnitude',min:0,max:110,initial:50,step:1,unit:'°'},
  57:{label:'Regularization λ',min:0,max:.65,initial:.12,step:.01,unit:'ratio'},
  58:{label:'Tilt stiffness',min:.8,max:9,initial:4.1,step:.1,unit:'N·m/rad'},
  59:{label:'Asynchronous order',min:17,max:31,initial:23,step:1,unit:'Hz'},
  60:{label:'Available gain limit',min:0,max:2.3,initial:1.8,step:.05,unit:'s⁻¹'},
}

export function scientificStudy(id:number,p:number):Study {
  const time=sample(3)
  switch(id) {
    case 40: {
      const x=sample(32).map(v=>v-16)
      return result('Quadrupole calibration field','Pickup offset (mm)','mT',x,[s('Bx',x.map(v=>p*v)),s('By on matched diagonal',x.map(v=>-p*v))],[['Gradient',format(p,'T/m')]])
    }
    case 41: {
      const u=sample(.8)
      return result('Transverse magnetic pressure penalty','Duct velocity (m/s)','Pa',u,[s('Magnetic contribution',u.map(v=>magneticLoss(1.4,p,.058,v)))],
        [['Conductivity','1.4 S/m'],['Current-closure factor','0.65'],['Head at 0.8 m/s',format(magneticLoss(1.4,p,.058,.8),'Pa')]])
    }
    case 42: {
      const cell=sample(8,8)
      const nominal=cell.map(i=>3*Math.tanh((i-4)/1.15))
      const mass=.033, k=p, a=42, b=a/.003**2
      const rows=integrate([...nominal.map(x=>x/1000),...cell.map(()=>0)],.3,.001,(_,state)=>{
        const q=state.slice(0,9),v=state.slice(9)
        return [...v,...q.map((x,i)=>(k*((q[i-1]??-.003)-2*x+(q[i+1]??.003))+a*x-b*x**3-.6*v[i])/mass)]
      },5)
      return result('Nine-cell defect displacement','Cell index','mm',cell,[s('Initial domain wall',nominal),s('Response after 0.3 s',rows.at(-1)!.state.slice(0,9).map(v=>v*1000))],
        [['System','Fixed opposite displacement ends'],['Cell mass','0.033 kg']])
    }
    case 43: {
      const k=sample(850).map(v=>v+20)
      const dispersion=(v:number)=>9.81*v+.034/1180*v**3-.78*p*p*v*v
      return result('Surface mode dispersion margin','Wavenumber (1/m)','s⁻²',k,[s('Signed ω²',k.map(dispersion))],
        [['Minimum sampled ω²',format(Math.min(...k.map(dispersion)),'s⁻²')],['Magnetic term','Assumed calibration coefficient']])
    }
    case 44: {
      const f=sample(110).map(v=>v+1)
      const h0=(hz:number)=>1e6/dynamicStiffness(.14,3.5,9400,w(hz))
      return result('Directional active transmissibility','Frequency (Hz)','µm/N',f,[s('Driven path 2 ← 1',f.map(v=>p*h0(v))),s('Driven path 1 ← 2',f.map(v=>.75*h0(v)))],
        [['Gain ratio',format(p/.75,'1')],['Source','Powered transducer feedback']])
    }
    case 45: {
      const t=sample(12)
      let on=false,changed=-1
      const temp=t.map(v=>39+9*Math.sin(v*1.25))
      const act=t.map((v,i)=>{
        const next=nextHysteresis(on,temp[i],v-changed,p,p-3,.5)
        if(next!==on)changed=v
        on=next
        return on?1:0
      })
      return result('Fan hysteresis switching','Time (s)','state',t,[s('Fan enable',act)],[['Release threshold',format(p-3,'°C')],['Minimum dwell','0.50 s']])
    }
    case 46: {
      const rows=integrate([.12,0,0,0],3,.004,(_, [a,b,va,vb])=>[va,vb,(-2.1*a-p*va-.032*vb)/.033,(-2.7*b-p*vb+.032*va)/.036],5)
      return result('Biaxial tilt decay','Time (s)','mrad',rows.map(v=>v.t),[s('Y tilt',rows.map(v=>v.state[0]*1000)),s('Z tilt',rows.map(v=>v.state[1]*1000))],
        [['Gyroscopic term','0.032 N·m·s/rad']])
    }
    case 47: {
      const i=sample(2*p).map(v=>v-p)
      return result('Excitation current reversal','Current (A)','µT',i,[s('Finite solenoid center field',i.map(v=>MU0*6*v/Math.hypot(.043,.038)*1e6))],
        [['Turns','6'],['Winding length','43 mm'],['Mean radius','19 mm']])
    }
    case 48: {
      const t=sample(5)
      return result('Two-frequency orientation command','Time (s)','mrad',t,[s('Quasiperiodic demand',t.map(v=>6*Math.sin(w(p)*v)+3*Math.sin(Math.SQRT2*w(p)*v)))],
        [['Second frequency',format(p*Math.SQRT2,'Hz')],['Demand bound','9 mrad']])
    }
    case 49: {
      const f=sample(50)
      return result('Directional dynamic stiffness','Frequency (Hz)','N/m',f,[s('X-axis',f.map(v=>dynamicStiffness(.34,4,700,w(v)))),s('Y-axis',f.map(v=>dynamicStiffness(.34,7,p,w(v))))])
    }
    case 50: {
      const t=sample(.25)
      const ph=p*Math.PI/180
      return result('Buffered phasor conjugation','Time (s)','normalized',t,[s('Detected mode',t.map(v=>Math.cos(w(17)*v+ph))),s('Regenerated conjugate',t.map(v=>Math.cos(w(17)*v-ph)))],
        [['Applied conjugate phase',format(-p,'°')],['Boundary','Synchronous buffered tone']])
    }
    case 51: {
      const t=sample(9,900)
      let state=0x33d1a, x=-1
      const uniform=()=>{state=(Math.imul(1664525,state)+1013904223)>>>0;return (state+1)/4294967297}
      const y=t.map(v=>{
        const normal=Math.sqrt(-2*Math.log(uniform()))*Math.cos(2*Math.PI*uniform())
        x+=.01*(x-x**3+.11*Math.sin(w(.65)*v))+Math.sqrt(.02*p)*normal
        return x
      })
      return result('Seeded bistable trajectory','Time (s)','normalized',t,[s('State',y)],[['Seed','0x33d1a'],['Integration','Euler–Maruyama, Δt 0.01 s']])
    }
    case 52: {
      const q=sample(7.5)
      const velocity=(amount:number)=>amount*1e-6/.000063
      return result('Toroidal swirl pressure loss','Flow (mL/s)','Pa',q,[s('Loss',q.map(v=>p*997*velocity(v)**2/2))],
        [['Circulation at full sweep',format(2*Math.PI*.026*velocity(q.at(-1)!),'m²/s')],['Path radius','26 mm']])
    }
    case 53: {
      const rows=integrate([.66],3,.008,(_, [x])=>[x<=-2?0:p-x*x],3)
      return result('Saddle-node branch trajectory','Time (s)','normalized',rows.map(v=>v.t),[s('Branch state',rows.map(v=>v.state[0]))],
        [['Stable equilibrium',p>=0?format(Math.sqrt(p),'1'):'Boundary crossed'],['Lower domain guard','−2']])
    }
    case 54: {
      const q=sample(90)
      return result('Irreversible heat-transfer production','Transfer rate (W)','W/K',q,[s('Entropy production',q.map(v=>entropyProduction(v,p,296)))],
        [['Cold-side temperature','296 K'],['Production at 90 W',format(entropyProduction(90,p,296),'W/K')]])
    }
    case 55: {
      const turn=sample(1)
      const gamma=2*Math.PI*(1-Math.cos(p*Math.PI/180))
      return result('Transported orientation phase','Closed-loop fraction','rad',turn,[s('Enclosed solid-angle accumulation',turn.map(v=>v*gamma))],
        [['Final orientation phase',format(gamma,'rad')]])
    }
    case 56: {
      const angle=sample(110)
      return result('Ordered rotation commutator','Second-axis rotation (°)','°',angle,[s('Commutator rotation',angle.map(v=>commutatorAngle(p*Math.PI/180,v*Math.PI/180)*180/Math.PI))],
        [['Algebra','Unit quaternions on physical orientation']])
    }
    case 57: {
      const original=time.map(v=>Math.sin(w(4)*v)+.28*Math.sin(w(13)*v))
      let recovered=0
      const reconstructed=original.map((value,i)=>{
        const sensor=value+.42*(original[i-1]??0)
        recovered=(sensor-.42*recovered)/(1+p)
        return recovered
      })
      return result('Causal two-tap inversion','Time (s)','normalized',time,[s('Input',original),s('Recovered',reconstructed)],
        [['RMS residual',format(Math.sqrt(original.reduce((sum,v,i)=>sum+(v-reconstructed[i])**2,0)/original.length),'1')]])
    }
    case 58: {
      const t=sample(2)
      return result('Annular restoring torque','Time (s)','N·m',t,[s('Reaction',t.map(v=>-p*.04*Math.sin(w(2)*v)-.095*.04*w(2)*Math.cos(w(2)*v)))],
        [['Viscous coefficient','0.095 N·m·s/rad'],['Peak imposed tilt','0.04 rad']])
    }
    case 59: {
      const f=sample(40,160)
      const dt=.005
      const data=Array.from({length:400},(_,i)=>Math.sin(w(12)*i*dt)+.64*Math.sin(w(p)*i*dt))
      return result('Synchronous plus asynchronous mode spectrum','Analysis frequency (Hz)','normalized',f,[s('Mode amplitude',f.map(v=>2*Math.hypot(...complexTone(data,dt,v))/data.length))],
        [['Reference order','12 Hz'],['Asynchronous mode',format(p,'Hz')]])
    }
    case 60: {
      const rows=integrate([.35,.35],3,.016,(_, [u,v])=>[.9*u-u**3,(.9-scheduledGain(.9,p))*v-v**3],2)
      return result('Bounded normal-form stabilization','Time (s)','normalized',rows.map(v=>v.t),[s('Open loop',rows.map(v=>v.state[0])),s('Controlled',rows.map(v=>v.state[1]))],
        [['Scheduled gain',format(scheduledGain(.9,p),'s⁻¹')],['Small-signal decay',format(scheduledGain(.9,p)-.9,'s⁻¹')]])
    }
    default: throw new RangeError('Unknown scientific station')
  }
}
