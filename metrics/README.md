# Playwright Metrics System

This metrics system provides comprehensive test analytics for Playwright test suites, tracking test-level, shard-level, and suite-level metrics with InfluxDB integration.

## Metrics Overview

### Test-Level Metrics (`test_run` measurement)
- **playwright_test_status_total** 🟢🔴 - Count of passed/failed/skipped tests
- **playwright_test_flakiness_ratio** ⚡ - Percentage of flakiness (failures ÷ total runs)
- **playwright_test_assertion_errors** ❌ - Number of assertion errors in test
- **playwright_test_retry_total** 🔁 - Total retries for the test
- **playwright_test_duration_seconds** ⏱️ - Test execution duration

### Shard-Level Metrics (`shard_summary` measurement)
- **playwright_shard_avg_duration_seconds** ⏱️ - Average test duration in shard
- **playwright_shard_parallelism** 🧵 - Number of workers used in shard
- **playwright_shard_fail_rate** 🔥 - Percentage of failed tests in shard
- **playwright_shard_retry_total** 🔁 - Total retries in shard
- **playwright_shard_slowest_test_duration** 🐢 - Slowest single test in shard

### Suite-Level Metrics (`suite_summary` measurement)
- **playwright_suite_pass_rate** ✅ - Pass rate percentage per suite
- **playwright_suite_avg_duration_seconds** ⏱️ - Average duration per suite run
- **playwright_suite_flakiness_hotspots** 🚨 - Tests that failed 2+ times
- **playwright_suite_reruns_total** 🔄 - Total reruns across suite
- **playwright_suite_skips_total** ⏭️ - Total skipped tests daily



## Configuration

Set these environment variables to configure the metrics system:

```bash
# Required
INFLUX_TOKEN=your_influxdb_token

# Optional (with defaults)
SHARD=1                    # Shard identifier
SUITE=default              # Suite name
WORKERS=1                  # Number of parallel workers
```

## Playwright Configuration

Add the reporter to your `playwright.config.ts`:

```typescript
import { defineConfig } from '@playwright/test';
import InfluxReporter from './metrics/influx-reporter';

export default defineConfig({
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['', InfluxReporter] // Custom InfluxDB reporter
  ],
  // ... other config
});
```

## Example InfluxDB Queries

### Find Flaky Tests (Last 7 Days)
```sql
from(bucket: "nrgwright")
  |> range(start: -7d)
  |> filter(fn: (r) => r._measurement == "test_run")
  |> filter(fn: (r) => r._field == "playwright_test_flakiness_ratio")
  |> filter(fn: (r) => r._value > 20.0)
  |> group(columns: ["test_name"])
  |> mean()
```

### Slowest Shards
```sql
from(bucket: "nrgwright")
  |> range(start: -24h)
  |> filter(fn: (r) => r._measurement == "shard_summary")
  |> filter(fn: (r) => r._field == "playwright_shard_avg_duration_seconds")
  |> group(columns: ["shard"])
  |> mean()
  |> sort(columns: ["_value"], desc: true)
```

### Suite Performance Trends
```sql
from(bucket: "nrgwright")
  |> range(start: -30d)
  |> filter(fn: (r) => r._measurement == "suite_summary")
  |> filter(fn: (r) => r._field == "playwright_suite_pass_rate")
  |> group(columns: ["suite"])
  |> aggregateWindow(every: 1d, fn: mean)
```



## Data Structure

### test_run Measurement
- **Tags**: `test_name`, `shard`
- **Fields**: `status`, `playwright_test_status_total`, `playwright_test_flakiness_ratio`, `playwright_test_assertion_errors`, `playwright_test_retry_total`, `playwright_test_duration_seconds`

### shard_summary Measurement
- **Tags**: `shard`
- **Fields**: `total_tests`, `pass_count`, `fail_count`, `skip_count`, `playwright_shard_retry_total`, `playwright_shard_avg_duration_seconds`, `playwright_shard_parallelism`, `playwright_shard_fail_rate`, `playwright_shard_slowest_test_duration`

### suite_summary Measurement
- **Tags**: `suite`
- **Fields**: `total_tests`, `pass_count`, `fail_count`, `skip_count`, `playwright_suite_pass_rate`, `playwright_suite_avg_duration_seconds`, `playwright_suite_reruns_total`, `playwright_suite_skips_total`, `playwright_suite_flakiness_hotspots`



## Usage Examples

### Running with Different Shards
```bash
# Shard 1
SHARD=1 WORKERS=4 npx playwright test

# Shard 2  
SHARD=2 WORKERS=4 npx playwright test
```

### Different Suites
```bash
# Smoke tests
SUITE=smoke npx playwright test --grep "smoke"

# E2E tests
SUITE=e2e npx playwright test --grep "e2e"
```


