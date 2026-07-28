// @ts-check
const { defineConfig } = require('@playwright/test');

/* The build has no server dependency — tests load index.html over file://,
   which also proves the "just open the file" requirement holds. */
module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  workers: process.env.CI ? 2 : undefined,
  reporter: [['list']],
  timeout: 30000,
  expect: { timeout: 5000 },
  use: {
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    launchOptions: { args: ['--allow-file-access-from-files', '--mute-audio'] }
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } }
  ]
});
