// @ts-check
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: 'tests',
  timeout: 60_000,
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL: 'http://127.0.0.1:8877',
    viewport: { width: 390, height: 844 },
    locale: 'zh-TW',
  },
  webServer: {
    command: 'python3 -m http.server 8877',
    port: 8877,
    reuseExistingServer: !process.env.CI,
  },
});
