import partRows from '../data/parts.json'
import assemblyRows from '../data/assemblies.json'
import linkRows from '../data/connections.json'
import { assembliesSchema, connectionsSchema, partsSchema } from './schemas/part'

export const parts = partsSchema.parse(partRows)
export const assemblies = assembliesSchema.parse(assemblyRows)
export const connections = connectionsSchema.parse(linkRows)
export const partById = new Map(parts.map(part => [part.id, part]))
export const assemblyById = new Map(assemblies.map(assembly => [assembly.id, assembly]))
export const linksFor = (id: string) => connections.filter(link => link.from === id || link.to === id)

export function integrityErrors(): string[] {
  const errors: string[] = []
  const checkUnique = (ids: string[], label: string) => {
    if (new Set(ids).size !== ids.length) errors.push(`Duplicate ${label}`)
  }
  checkUnique(parts.map(part => part.id), 'part IDs')
  checkUnique(assemblies.map(assembly => assembly.id), 'assembly IDs')
  checkUnique(connections.map(link => link.id), 'connection IDs')
  for (const part of parts) {
    const owners = assemblies.filter(assembly => assembly.partIds.includes(part.id))
    if (owners.length !== 1 || owners[0].id !== part.assemblyId) errors.push(`Invalid owner for ${part.id}`)
    for (const id of [...part.matingPartIds, ...part.fastenerIds, ...part.sensors]) {
      if (!partById.has(id) || id === part.id) errors.push(`Invalid reference ${part.id} → ${id}`)
    }
    const mechanical = new Set(linksFor(part.id).filter(link => link.kind === 'mechanical')
      .map(link => link.from === part.id ? link.to : link.from))
    if (mechanical.size !== part.matingPartIds.length || part.matingPartIds.some(id => !mechanical.has(id))) {
      errors.push(`Mating list differs from mechanical network for ${part.id}`)
    }
    if (!linksFor(part.id).length) errors.push(`No connections for ${part.id}`)
  }
  for (const assembly of assemblies) {
    checkUnique(assembly.partIds, `members in ${assembly.id}`)
    for (const id of assembly.partIds) if (!partById.has(id)) errors.push(`Unknown member ${id}`)
  }
  for (const link of connections) {
    if (!partById.has(link.from) || !partById.has(link.to) || link.from === link.to) errors.push(`Invalid link ${link.id}`)
  }
  return errors
}
