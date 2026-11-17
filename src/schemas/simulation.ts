import { z } from 'zod'
import rows from '../../data/simulations.json'

const id = z.enum(['rotor','unbalance','vibration','torsion','electrical','thermal','phase','ac','flow','integrated'])
export const simulationSchema = z.array(z.strictObject({
  id, name: z.string(), equation: z.string(), assumptions: z.string(), provenance: z.enum(['simulation','synthetic']),
  inputs: z.array(z.strictObject({ id:z.string(), label:z.string(), unit:z.string(), min:z.number(), max:z.number(),
    step:z.number().positive(), default:z.number() })),
}))
export const simulations = simulationSchema.parse(rows)
export type SimulationId = z.infer<typeof id>
