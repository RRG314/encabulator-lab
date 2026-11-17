import { defineConfig } from '@playwright/test'

const browserServer = process.env.CI ? 'preview' : 'dev'
const base = (process.env.PAGES_BASE_PATH??'').replace(/\/$/,'')
const site = `http://127.0.0.1:5173${base}/`

export default defineConfig({
  testDir: './tests/browser',
  use: {
    baseURL: site,
    channel: process.env.TE01_CHROME_CHANNEL === 'chrome' ? 'chrome' : undefined,
    launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] },
  },
  webServer: { command: `npm run ${browserServer} -- --host 127.0.0.1 --port 5173 --strictPort`, url: site, reuseExistingServer: !process.env.CI },
})
