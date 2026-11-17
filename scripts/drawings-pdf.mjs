import { URL } from "node:url"

import { readFile, readdir } from 'node:fs/promises'
import process from 'node:process'
import { chromium } from '@playwright/test'

const model=process.argv[2]??'te01'
if (!['te01','re01','me01'].includes(model)) throw new TypeError('Specify te01, re01 or me01')
const drawings = new URL(model==='te01'?'../public/models/te01-drawings/':`../public/models/${model}/drawings/`, import.meta.url)
const names = (await readdir(drawings)).filter(name => name.endsWith('.svg')).sort()
const first = [`${model.toUpperCase()}-ASSEMBLY.svg`, `${model.toUpperCase()}-EXPLODED.svg`]
const order = [...first, ...names.filter(name => !first.includes(name))]
const contents = await Promise.all(order.map(name => readFile(new URL(name, drawings), 'utf8')))
const browser = await chromium.launch({channel:process.env.TE01_CHROME_CHANNEL==='chrome'?'chrome':undefined})
try {
  const page = await browser.newPage()
  await page.setContent(`<!doctype html><meta charset="utf-8"><title>${model.toUpperCase()} engineering review drawing set</title>
    <style>@page { size: A4 landscape; margin: 0 } body { margin: 0 }
    section { width: 297mm; height: 210mm; display: grid; place-items: center; break-after: page }
    section:last-child { break-after: auto } svg { width: 282mm; height: 200mm }</style>
    ${contents.map(svg => `<section>${svg}</section>`).join('')}`)
  await page.pdf({ path: `public/models/${model==='te01'?'':model+'/'}${model}-drawings.pdf`, printBackground: true, preferCSSPageSize: true })
} finally {
  await browser.close()
}
