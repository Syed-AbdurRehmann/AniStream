import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
    viewport: { width: 1280, height: 720 },
    actionTimeout: 10_000,
    ignoreHTTPSErrors: true,
  },
  webServer: [
    {
      command: 'node server/server.js',
      port: 3001,
      reuseExistingServer: true,
      timeout: 15_000,
    },
    {
      command: 'npx vite --port 3000',
      port: 3000,
      reuseExistingServer: true,
      timeout: 20_000,
    },
  ],
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
});
