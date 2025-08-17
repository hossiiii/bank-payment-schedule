/**
 * Playwright Configuration for Bank Payment Schedule App
 * Phase 3 comprehensive E2E testing setup
 * Cross-browser compatibility and PWA functionality testing
 */

import { defineConfig, devices } from '@playwright/test';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './__tests__/e2e',
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : 4,
  
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'playwright-results.json' }],
    ['junit', { outputFile: 'playwright-results.xml' }],
    ['list'],
  ],
  
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Capture screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Capture video on failure */
    video: 'retain-on-failure',
    
    /* Timeout for each action */
    actionTimeout: 10000,
    
    /* Timeout for navigation */
    navigationTimeout: 30000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    
    // Desktop browsers
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Additional Chrome-specific settings
        launchOptions: {
          args: [
            '--disable-web-security',
            '--allow-running-insecure-content',
            '--disable-features=VizDisplayCompositor',
          ],
        },
      },
      dependencies: ['setup'],
    },

    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        // Firefox-specific settings
        launchOptions: {
          firefoxUserPrefs: {
            'dom.serviceWorkers.enabled': true,
            'dom.serviceWorkers.testing.enabled': true,
          },
        },
      },
      dependencies: ['setup'],
    },

    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        // Safari-specific settings
      },
      dependencies: ['setup'],
    },

    // Mobile browsers
    {
      name: 'Mobile Chrome',
      use: { 
        ...devices['Pixel 5'],
        // Mobile Chrome settings
        contextOptions: {
          permissions: ['notifications'],
        },
      },
      dependencies: ['setup'],
    },
    
    {
      name: 'Mobile Safari',
      use: { 
        ...devices['iPhone 12'],
        // Mobile Safari settings
      },
      dependencies: ['setup'],
    },
    
    // Tablet
    {
      name: 'iPad',
      use: { 
        ...devices['iPad Pro'],
      },
      dependencies: ['setup'],
    },

    // Edge browser
    {
      name: 'Microsoft Edge',
      use: { 
        ...devices['Desktop Edge'],
        channel: 'msedge',
      },
      dependencies: ['setup'],
    },

    // PWA-specific testing
    {
      name: 'PWA Chrome',
      use: {
        ...devices['Desktop Chrome'],
        contextOptions: {
          serviceWorkers: 'allow',
          permissions: ['notifications', 'persistent-notification'],
        },
        launchOptions: {
          args: [
            '--enable-features=ServiceWorkerOnUI',
            '--enable-experimental-web-platform-features',
          ],
        },
      },
      dependencies: ['setup'],
    },

    // High DPI testing
    {
      name: 'High DPI',
      use: {
        ...devices['Desktop Chrome HiDPI'],
      },
      dependencies: ['setup'],
    },

    // Network conditions testing
    {
      name: 'Slow Network',
      use: {
        ...devices['Desktop Chrome'],
        contextOptions: {
          offline: false,
        },
        launchOptions: {
          args: ['--simulate-outdated-no-au', '--force-effective-connection-type=slow-2g'],
        },
      },
      dependencies: ['setup'],
    },

    // Dark mode testing
    {
      name: 'Dark Mode',
      use: {
        ...devices['Desktop Chrome'],
        colorScheme: 'dark',
      },
      dependencies: ['setup'],
    },

    // Accessibility testing
    {
      name: 'Accessibility',
      use: {
        ...devices['Desktop Chrome'],
        // Force motion reduction for accessibility testing (configured separately)
      },
      dependencies: ['setup'],
    },
  ],

  /* Global setup and teardown */
  globalSetup: require.resolve('./playwright-global-setup.ts'),
  globalTeardown: require.resolve('./playwright-global-teardown.ts'),

  /* Test timeout */
  timeout: 60000,

  /* Expect timeout */
  expect: {
    timeout: 10000,
  },

  /* Run your local dev server before starting the tests */
  webServer: process.env.CI ? [] : {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    env: {
      NODE_ENV: 'test',
    },
  },

  /* Test output directory */
  outputDir: 'test-results/',

  /* Global test configuration */
  globalTimeout: 60000 * 10, // 10 minutes total
  
  /* Grep settings for filtering tests */
  ...(process.env.PLAYWRIGHT_GREP ? { grep: new RegExp(process.env.PLAYWRIGHT_GREP) } : {}),
  ...(process.env.PLAYWRIGHT_GREP_INVERT ? { grepInvert: new RegExp(process.env.PLAYWRIGHT_GREP_INVERT) } : {}),

  /* Metadata for test reporting */
  metadata: {
    testEnvironment: process.env.NODE_ENV || 'test',
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    timestamp: new Date().toISOString(),
    version: require('./package.json').version,
  },
});