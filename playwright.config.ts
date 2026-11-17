import { defineConfig } from '@playwright/test'

const browserServer = process.env.CI ? 'preview' : 'dev'

export default defineConfig({
  testDir: './tests/browser',
  use: {
    baseURL: 'http://127.0.0.1:5173',
    channel: process.env.TE01_CHROME_CHANNEL === 'chrome' ? 'chrome' : undefined,
    launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] },
  },
  webServer: { command: `npm run ${browserServer} -- --host 127.0.0.1 --port 5173 --strictPort`, url: 'http://127.0.0.1:5173', reuseExistingServer: !process.env.CI },
})
