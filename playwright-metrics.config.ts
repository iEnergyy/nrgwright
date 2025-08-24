import { defineConfig, devices } from '@playwright/test';
import InfluxReporter from './metrics/influx-reporter';

/**
 * Example Playwright configuration with enhanced metrics
 * 
 * Environment variables to set:
 * - INFLUX_TOKEN: Your InfluxDB token
 * - SHARD: Shard identifier (1, 2, 3, etc.)
 * - SUITE: Suite name (smoke, e2e, regression, etc.)
 * - WORKERS: Number of parallel workers
 */

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }],
    ['', InfluxReporter], // Custom InfluxDB reporter
  ],
  use: {
    baseURL: 'https://example.com',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  // Configure projects for different browsers
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--disable-dev-shm-usage', '--no-sandbox']
        }
      }
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        launchOptions: {
          firefoxUserPrefs: {
            'dom.webdriver.enabled': false,
            'useAutomationExtension': false
          }
        }
      }
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        launchOptions: {
          args: ['--disable-dev-shm-usage']
        }
      }
    },
  ],

  // Sharding configuration
  shard: {
    total: parseInt(process.env.TOTAL_SHARDS || '1'),
    current: parseInt(process.env.SHARD || '1'),
  },

  // Global setup and teardown (uncomment if you have these files)
  // globalSetup: require.resolve('./lib/global-setup'),
  // globalTeardown: require.resolve('./lib/global-teardown'),

  // Test output directory
  outputDir: 'test-results/',

  // Web server for testing
  webServer: {
    command: 'npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});

// Example environment-specific configurations
export const smokeConfig = defineConfig({
  ...defineConfig,
  testMatch: '**/*smoke*.spec.ts',
  env: {
    SUITE: 'smoke',
    WORKERS: '2'
  }
});

export const e2eConfig = defineConfig({
  ...defineConfig,
  testMatch: '**/*e2e*.spec.ts',
  env: {
    SUITE: 'e2e',
    WORKERS: '4'
  }
});

export const regressionConfig = defineConfig({
  ...defineConfig,
  testMatch: '**/*regression*.spec.ts',
  env: {
    SUITE: 'regression',
    WORKERS: '8'
  }
});

// CI/CD specific configuration
export const ciConfig = defineConfig({
  ...defineConfig,
  retries: 2,
  workers: 4,
  timeout: 60000,
  env: {
    CI: 'true',
    WORKERS: '4'
  }
});
