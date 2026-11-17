import { URL } from "node:url"

import { readFile, readdir } from 'node:fs/promises'
import { chromium } from '@playwright/test'

const drawings = new URL('../cad/drawings/', import.meta.url)
const names = (await readdir(drawings)).filter(name => name.endsWith('.svg')).sort()
const first = ['TE01-ASSEMBLY.svg', 'TE01-EXPLODED.svg']
const order = [...first, ...names.filter(name => !first.includes(name))]
const contents = await Promise.all(order.map(name => readFile(new URL(name, drawings), 'utf8')))
const browser = await chromium.launch()
try {
  const page = await browser.newPage()
  await page.setContent(`<!doctype html><meta charset="utf-8"><title>TE-01 engineering review drawing set</title>
    <style>@page { size: A4 landscape; margin: 0 } body { margin: 0 }
    section { width: 297mm; height: 210mm; display: grid; place-items: center; break-after: page }
    section:last-child { break-after: auto } svg { width: 282mm; height: 200mm }</style>
    ${contents.map(svg => `<section>${svg}</section>`).join('')}`)
  await page.pdf({ path: 'public/models/te01-drawings.pdf', printBackground: true, preferCSSPageSize: true })
} finally {
  await browser.close()
}
