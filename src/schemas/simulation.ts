import { z } from 'zod'
import overrides from '../../data/re01/simulation-overrides.json'
import type { MachineKey } from '../machines/profiles'
import rows from '../../data/simulations.json'

const id = z.enum(['rotor','unbalance','vibration','torsion','electrical','thermal','phase','ac','flow','integrated','crank','winding'])
export const simulationSchema = z.array(z.strictObject({
  id, name: z.string(), equation: z.string(), assumptions: z.string(), provenance: z.enum(['simulation','synthetic']),
  inputs: z.array(z.strictObject({ id:z.string(), label:z.string(), unit:z.string(), min:z.number(), max:z.number(),
    step:z.number().positive(), default:z.number() })),
}))
export const simulations = simulationSchema.parse(rows)
export type SimulationId = z.infer<typeof id>

type StudySchema = typeof simulations[number]
const retroOverrides: Record<string,Record<string,number>>=overrides
const selectedStudies: StudySchema[] = [
  {id:'crank',name:'Reciprocating water circuit',equation:'x = r cos θ + √(L² − r² sin² θ) · Ẇ = Q Δp',
    assumptions:'The eccentric runs through a 20:1 reduction. Flow is the cycle-averaged displacement of a 9 mm bore pump with 0.8 volumetric efficiency. Applicable to the low-head water-loop scenario.',
    provenance:'simulation', inputs:[
      {id:'rpm',label:'Waneshaft rate',unit:'rpm',min:300,max:2100,step:25,default:1550},
      {id:'head',label:'Static head',unit:'kPa',min:0,max:75,step:1,default:18},
    ]},
  {id:'winding',name:'Winding inductive transient',equation:'i(t) = (V − kₑΩ)/R · (1 − exp(−tR/L))',
    assumptions:'Single equivalent phase path at fixed speed, with no commutation and an imposed voltage step. The winding constants are assumed independent of saturation.',
    provenance:'simulation',inputs:[
      {id:'voltage',label:'Applied voltage',unit:'V',min:10,max:52,step:.5,default:32},
      {id:'rpm',label:'Rotor rate',unit:'rpm',min:0,max:2100,step:25,default:1550},
      {id:'r',label:'Resistance',unit:'Ω',min:1,max:9,step:.1,default:3.1},
      {id:'l',label:'Inductance',unit:'mH',min:1,max:36,step:.5,default:11},
    ]},
]
const retro=simulations.map(study=>{
  const inputs=study.inputs.map(input=>{
    const next=retroOverrides[study.id]?.[input.id]??input.default
    if (input.id==='voltage' && ['electrical','integrated'].includes(study.id)) return {...input,min:24,max:58,default:next}
    if (input.id==='rpm' && study.id==='integrated') return {...input,max:2100,default:next}
    if (study.id==='flow' && input.id==='restriction') return {...input,step:0.005,default:next}
    return {...input,default:next}
  })
  if (study.id==='integrated') inputs.push({id:'head',label:'Water loop head',unit:'kPa',min:0,max:75,step:1,default:18})
  return {...study, inputs, name:study.id==='integrated'?'Industrial automation & interlocks':study.name}
})
export const simulationProfiles:Record<MachineKey,StudySchema[]>={te01:simulations,re01:[...retro,...selectedStudies]}
