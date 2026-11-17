import { z } from 'zod'
import functionalRows from '../../data/functional.json'
import serviceRows from '../../data/service.json'
import { assemblyId, partId } from './part'

export const functionalSchema = z.array(z.strictObject({
  id: z.string().regex(/^TE-[1-9]00$/), name: z.string().min(1),
  assemblies:z.array(assemblyId).min(1), interfaces:z.array(partId),
}))
export const serviceSchema = z.record(partId, z.strictObject({failureMode:z.string().min(1)}))
export const functionalGroups = functionalSchema.parse(functionalRows)
export const service = serviceSchema.parse(serviceRows)
