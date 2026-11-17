import { expect, test } from '@playwright/test'

test('opens the WebGL model, searches, isolates and explodes with reduced motion', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await expect(page.locator('canvas')).toBeVisible()
  await expect(page.getByText('Schematic elevation')).toHaveCount(0)
  await page.getByRole('searchbox', { name: 'Search components' }).fill('TE-006')
  await page.getByRole('button', { name: 'Spurving bearings ×2', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Spurving bearings' })).toBeVisible()
  await page.getByRole('button', { name: 'Isolate component' }).click()
  await expect(page.getByRole('button', { name: 'Show assembly' })).toHaveAttribute('aria-pressed', 'true')
  const explode = page.getByRole('slider', { name: 'Exploded distance' })
  await explode.focus()
  await explode.press('End')
  await expect(explode).toHaveValue('100')
  await page.getByRole('button', { name: 'Animate assembly sequence' }).click()
  await expect(explode).toHaveValue('0')
  await page.getByRole('button', { name: 'View options' }).click()
  await page.getByLabel('Section').selectOption('Longitudinal')
  await expect(page.locator('canvas')).toBeVisible()
  await page.getByRole('link', { name: 'Engineering record' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Spurving bearings' })).toBeVisible()
  await page.getByRole('link', { name: 'Locate in explorer' }).click()
  await expect(page.getByRole('heading', { level: 3, name: 'Spurving bearings' })).toBeVisible()
  expect(errors).toEqual([])
})

test('keeps mobile parts navigation when WebGL is unavailable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, ...args: Parameters<typeof getContext>) {
      return args[0].startsWith('webgl') ? null : getContext.apply(this, args)
    } as typeof getContext
  })
  await page.goto('/')
  await expect(page.getByText('Schematic elevation')).toBeVisible()
  await page.getByRole('searchbox', { name: 'Search components' }).fill('main shaft')
  await page.getByRole('button', { name: 'Main shaft', exact: true }).click()
  await expect(page.getByRole('heading', { level: 3, name: 'Main shaft' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
})

test('loads CAD mesh, changes study inputs and replays a guard fault', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('CAD SCHEMATIC', { exact: true })).toBeVisible()
  await page.getByRole('link', { name: 'Simulations' }).click()
  await expect(page.getByRole('heading', { name: 'Simulation laboratory' })).toBeVisible()
  await page.getByRole('button', { name: 'Phase estimation' }).click()
  await expect(page.getByRole('img', { name: /synthetic plot/ })).toBeVisible()
  await page.getByRole('checkbox', { name: 'Inject missing samples' }).check()
  await expect(page.getByText('Insufficient signal')).toBeVisible()
  await page.getByRole('button', { name: 'Integrated plant' }).click()
  await page.getByRole('link', { name: 'Open 3D diagnostic replay' }).click()
  await expect(page.getByRole('heading', { name: 'Diagnostic replay' })).toBeVisible()
  await page.getByLabel('Fault scenario').selectOption('Guard open')
  const timeline = page.getByRole('slider', { name: 'Time', exact: true })
  await timeline.focus()
  await timeline.press('End')
  await expect(page.getByText('Guard open · drive inhibited')).toBeVisible()
  await expect(page.locator('canvas')).toBeVisible()
})

test('checks principal pages for WCAG A and AA violations', async ({ page }) => {
  const { AxeBuilder } = await import('@axe-core/playwright')
  for (const route of ['explorer','component/TE-009','simulation','engineering/downloads','bom']) {
    await page.goto(`/#/${route}`)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    const result = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze()
    expect(result.violations.map(item => ({ id:item.id, description:item.description, nodes:item.nodes.map(n=>n.target) }))).toEqual([])
  }
})

test('keeps the touch layout within narrow mobile viewports', async ({ browser }) => {
  const context = await browser.newContext({ hasTouch:true,isMobile:true,viewport:{width:320,height:720} })
  const page = await context.newPage()
  await page.goto('/')
  await expect(page.locator('canvas')).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320)
  await page.getByRole('button', { name: '100% · Exploded' }).tap()
  await expect(page.getByRole('slider', { name: 'Exploded distance' })).toHaveValue('100')
  await context.close()
})
