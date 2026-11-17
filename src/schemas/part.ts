import { z } from 'zod'

const text = z.string().min(1)
export const partId = z.string().regex(/^(?:TE-0(?:0[1-9]|[12][0-9]|30)|RE-0(?:0[1-9]|[1-9][0-9]))$/)
export const assemblyId = z.string().regex(/^(?:ABA|SBA|HMA|DGS|PFA|LCA|CGM|UPD|CSC|RE-(?:[1-9]|1[0-5])00)$/)
export const evidence = z.enum(['target', 'assumption', 'simulation', 'calculation', 'measurement'])
export const partSchema = z.strictObject({
  id: partId, name: text, assemblyId, revision: text, description: text, function: text,
  material: text.nullable(), quantity: z.union([z.number().int().positive(), z.literal('set')]),
  massKg: z.number().positive().nullable(),
  dimensionsMm: z.record(text, z.number().positive()).nullable(),
  mounting: text, matingPartIds: z.array(partId), fastenerIds: z.array(partId),
  sensors: z.array(partId), ports: z.array(text), equations: z.array(text),
  limits: text, safetyFlags: z.array(text), maintenance: text,
  cadAssetPath: text.nullable(), diagramRefs: z.array(text).min(1), testEvidence: z.array(text),
  sourcing: text, readiness: z.literal('Preliminary'), evidence,
  proposedSpecification: text, sourceAssembly: text, verification: text,
  kind: z.enum(['physical', 'logical', 'optional']),
})
export const assemblySchema = z.strictObject({
  id: assemblyId, name: text, shortName: text, description: text,
  order: z.number().int().positive(), partIds: z.array(partId).min(1),
})
export const connectionSchema = z.strictObject({
  id: text, from: partId, to: partId, kind: z.enum(['mechanical', 'power', 'signal', 'airflow', 'thermal']),
  label: text,
})
export const partsSchema = z.array(partSchema)
export const assembliesSchema = z.array(assemblySchema)
export const connectionsSchema = z.array(connectionSchema)
export type Part = z.infer<typeof partSchema>
export type PartId = z.infer<typeof partId>
export type AssemblyId = z.infer<typeof assemblyId>
export type Connection = z.infer<typeof connectionSchema>
