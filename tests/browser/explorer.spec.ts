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
