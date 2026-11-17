import { expect, test } from '@playwright/test'

test('opens the interactive Metachronic assembly and carries a part into the workbench', async ({ browser }) => {
  test.setTimeout(75000)
  const context = await browser.newContext({
    hasTouch: true,
    isMobile: true,
    reducedMotion: 'reduce',
    viewport: { width: 390, height: 844 },
  })
  const page = await context.newPage()
  await page.goto('./')
  await expect(page).toHaveTitle(/Encabulation Systems Inc/)
  await expect(page.getByRole('heading', { level: 1, name: 'Advanced encabulation and differential synchronization' })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('link', { name: 'Test bench' })).toHaveAttribute('href', '#/me01/simulation')
  await expect(page.getByText('CAD schematic', { exact: true })).toBeVisible({ timeout: 20000 })
  await expect(page.locator('canvas')).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
  await expect(page.getByRole('button', { name: 'Auto-orbit' })).toBeDisabled()
  const component = page.getByRole('combobox', { name: 'Preview component' })
  await component.selectOption('ME-001')
  await expect(page.getByRole('link', { name: 'ME-001 · Amulite ribbed foundation' })).toBeVisible()
  const xray = page.getByRole('button', { name: 'X-ray', exact: true })
  await xray.tap()
  await expect(xray).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: 'Animate assembly sequence' }).tap()
  await expect(page.getByRole('slider', { name: 'Exploded distance' })).toHaveValue('100')
  await page.getByRole('link', { name: 'Open engineering workbench' }).tap()
  await expect(page).toHaveURL(/#\/me01\/explorer$/)
  await expect(page.getByRole('heading', { level: 3, name: 'Amulite ribbed foundation' })).toBeVisible({ timeout: 20000 })
  await context.close()
})
