import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { assemblies, integrityErrors, parts } from '../src/data'

describe('canonical registry', () => {
  it('contains each BOM ID and exact quantity with nine canonical assemblies', () => {
    const bom = readFileSync(new URL('../docs/engineering/bom.csv', import.meta.url), 'utf8')
    const rows = [...bom.matchAll(/^(TE-\d+),(\d+|set),/gm)].map(([, id, qty]) => [id, qty])
    expect(rows).toHaveLength(30)
    expect(parts.map(part => [part.id, String(part.quantity)])).toEqual(rows)
    expect(assemblies).toHaveLength(9)
  })

  it('resolves ownership, mating links, sensors and fastener references', () => {
    expect(integrityErrors()).toEqual([])
  })

  it('keeps unverified physical attributes and CAD assets unassigned', () => {
    expect(parts.every(part => part.massKg === null && part.cadAssetPath === null && part.testEvidence.length === 0)).toBe(true)
  })
})
