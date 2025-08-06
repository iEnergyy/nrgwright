# Playwright Prometheus Metrics Guide

This guide explains how to use and interpret the Prometheus metrics collected from your Playwright test suite.

## Overview

The Prometheus reporter collects detailed metrics about your test execution, including:
- **Test Duration**: How long each test takes to run
- **Test Retries**: How many times tests are retried
- **Test Status**: Pass/fail/skip rates
- **Project Information**: Which project/browser the test ran in

## Metrics Collected

### 1. Test Duration Histogram
```
playwright_test_duration_seconds
```

**Labels:**
- `test`: Test name/title
- `project`: Project name (e.g., "Web", "Chrome")
- `status`: Test result (passed, failed, skipped, timed_out)

**Buckets:** 0.1s, 0.5s, 1s, 2s, 5s, 10s, +Inf

### 2. Test Retry Counter
```
playwright_test_retry_total
```

**Labels:**
- `test`: Test name/title
- `project`: Project name

**Value:** Number of retries for each test

## How to Run Tests with Metrics

### Basic Usage
```bash
# Run all tests with metrics collection
npm test

# Run specific test file
npx playwright test retry-test.spec.ts

# Run with retries enabled (CI mode)
CI=true npm test
```

### Environment Variables
```bash
# Set project name for metrics
PLAYWRIGHT_PROJECT=Web npm test

# Disable PushGateway upload (for local development)
METRICS_PUSH=false npm test

# Custom PushGateway URL
PUSHGATEWAY_URL=http://your-prometheus:9091 npm test
```

## Reading the Metrics

### 1. Console Output
When tests run, you'll see:
```
📊 Recording metrics for test "NAV1: Main menu navigation" in project "Web"
📊 Prometheus Metrics Preview:
# HELP playwright_test_duration_seconds Test duration in seconds
# TYPE playwright_test_duration_seconds histogram
playwright_test_duration_seconds_bucket{le="0.1",test="NAV1: Main menu navigation",project="Web",status="passed"} 0
playwright_test_duration_seconds_bucket{le="0.5",test="NAV1: Main menu navigation",project="Web",status="passed"} 0
playwright_test_duration_seconds_bucket{le="1",test="NAV1: Main menu navigation",project="Web",status="passed"} 0
playwright_test_duration_seconds_bucket{le="2",test="NAV1: Main menu navigation",project="Web",status="passed"} 0
playwright_test_duration_seconds_bucket{le="5",test="NAV1: Main menu navigation",project="Web",status="passed"} 0
playwright_test_duration_seconds_bucket{le="10",test="NAV1: Main menu navigation",project="Web",status="passed"} 1
playwright_test_duration_seconds_bucket{le="+Inf",test="NAV1: Main menu navigation",project="Web",status="passed"} 1
playwright_test_duration_seconds_sum{test="NAV1: Main menu navigation",project="Web",status="passed"} 6.909
playwright_test_duration_seconds_count{test="NAV1: Main menu navigation",project="Web",status="passed"} 1
```

### 2. JSON Files
Metrics are saved to `./metrics/metrics-{timestamp}.json` for detailed analysis.

Example JSON structure:
```json
[
  {
    "name": "playwright_test_duration_seconds",
    "help": "Test duration in seconds",
    "type": "histogram",
    "values": [
      {
        "value": 0,
        "metricName": "playwright_test_duration_seconds_bucket",
        "labels": {
          "le": "0.1",
          "test": "NAV1: Main menu navigation",
          "project": "Web",
          "status": "passed"
        }
      }
    ]
  }
]
```

## Prometheus Queries

### Test Performance Analysis

#### 1. Average Test Duration
```promql
# Average duration across all tests
avg(playwright_test_duration_seconds_sum / playwright_test_duration_seconds_count)

# Average duration by project
avg by (project) (playwright_test_duration_seconds_sum / playwright_test_duration_seconds_count)
```

#### 2. Test Duration Percentiles
```promql
# 95th percentile test duration
histogram_quantile(0.95, rate(playwright_test_duration_seconds_bucket[5m]))

# 90th percentile by project
histogram_quantile(0.90, rate(playwright_test_duration_seconds_bucket[5m])) by (project)
```

#### 3. Slow Tests Detection
```promql
# Tests taking longer than 5 seconds
playwright_test_duration_seconds_bucket{le="5"} / playwright_test_duration_seconds_count < 0.9

# Tests in the 5-10 second bucket
playwright_test_duration_seconds_bucket{le="10"} - playwright_test_duration_seconds_bucket{le="5"}
```

### Test Reliability Analysis

#### 1. Retry Rate
```promql
# Total retries per test
playwright_test_retry_total

# Retry rate percentage
rate(playwright_test_retry_total[5m]) / rate(playwright_test_duration_seconds_count[5m]) * 100
```

#### 2. Test Success Rate
```promql
# Success rate by project
rate(playwright_test_duration_seconds_count{status="passed"}[5m]) / rate(playwright_test_duration_seconds_count[5m]) * 100

# Failure rate
rate(playwright_test_duration_seconds_count{status="failed"}[5m]) / rate(playwright_test_duration_seconds_count[5m]) * 100
```

### Performance Trends

#### 1. Test Execution Rate
```promql
# Tests per minute
rate(playwright_test_duration_seconds_count[5m]) * 60

# Tests per minute by project
rate(playwright_test_duration_seconds_count[5m]) by (project) * 60
```

#### 2. Duration Trends
```promql
# Moving average of test duration
avg_over_time(playwright_test_duration_seconds_sum / playwright_test_duration_seconds_count[10m])
```

## Grafana Dashboards

### Sample Dashboard Queries

#### 1. Test Performance Overview
```promql
# Panel 1: Test Execution Rate
rate(playwright_test_duration_seconds_count[5m]) * 60

# Panel 2: Average Test Duration
avg(playwright_test_duration_seconds_sum / playwright_test_duration_seconds_count)

# Panel 3: Success Rate
rate(playwright_test_duration_seconds_count{status="passed"}[5m]) / rate(playwright_test_duration_seconds_count[5m]) * 100

# Panel 4: Retry Rate
rate(playwright_test_retry_total[5m])
```

#### 2. Test Duration Distribution
```promql
# Histogram of test durations
histogram_quantile(0.50, rate(playwright_test_duration_seconds_bucket[5m]))
histogram_quantile(0.90, rate(playwright_test_duration_seconds_bucket[5m]))
histogram_quantile(0.95, rate(playwright_test_duration_seconds_bucket[5m]))
histogram_quantile(0.99, rate(playwright_test_duration_seconds_bucket[5m]))
```

#### 3. Project Comparison
```promql
# Duration comparison by project
avg by (project) (playwright_test_duration_seconds_sum / playwright_test_duration_seconds_count)

# Success rate by project
rate(playwright_test_duration_seconds_count{status="passed"}[5m]) by (project) / rate(playwright_test_duration_seconds_count[5m]) by (project) * 100
```

## Alerting Rules

### 1. High Retry Rate Alert
```yaml
groups:
- name: playwright_alerts
  rules:
  - alert: HighTestRetryRate
    expr: rate(playwright_test_retry_total[5m]) / rate(playwright_test_duration_seconds_count[5m]) > 0.1
    for: 2m
    labels:
      severity: warning
    annotations:
      summary: "High test retry rate detected"
      description: "{{ $value }}% of tests are being retried"
```

### 2. Slow Test Alert
```yaml
  - alert: SlowTestsDetected
    expr: histogram_quantile(0.95, rate(playwright_test_duration_seconds_bucket[5m])) > 10
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "Slow tests detected"
      description: "95th percentile test duration is {{ $value }} seconds"
```

### 3. Test Failure Rate Alert
```yaml
  - alert: HighTestFailureRate
    expr: rate(playwright_test_duration_seconds_count{status="failed"}[5m]) / rate(playwright_test_duration_seconds_count[5m]) > 0.05
    for: 2m
    labels:
      severity: critical
    annotations:
      summary: "High test failure rate"
      description: "{{ $value }}% of tests are failing"
```

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Test with Metrics
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
    - name: Install dependencies
      run: npm ci
    - name: Install Playwright
      run: npx playwright install
    - name: Run tests with metrics
      run: |
        PLAYWRIGHT_PROJECT=Web
        CI=true
        npm test
    - name: Upload metrics
      uses: actions/upload-artifact@v2
      with:
        name: test-metrics
        path: metrics/
```

### GitLab CI Example
```yaml
test:
  stage: test
  variables:
    PLAYWRIGHT_PROJECT: "Web"
    CI: "true"
  script:
    - npm ci
    - npx playwright install
    - npm test
  artifacts:
    paths:
      - metrics/
    expire_in: 1 week
```

## Troubleshooting

### Common Issues

#### 1. No Project Name in Metrics
**Problem:** Project name shows as "default"
**Solution:** 
```bash
# Set project name explicitly
PLAYWRIGHT_PROJECT=Web npm test
```

#### 2. No Retry Metrics
**Problem:** Retry counter shows 0 even with retries
**Solution:**
```bash
# Enable retries in CI mode
CI=true npm test
```

#### 3. PushGateway Connection Failed
**Problem:** Metrics not pushed to Prometheus
**Solution:**
```bash
# Check PushGateway URL
PUSHGATEWAY_URL=http://your-gateway:9091 npm test

# Or disable pushing for local development
METRICS_PUSH=false npm test
```

### Debug Mode
```bash
# Enable detailed logging
DEBUG=playwright:* npm test
```

## Best Practices

1. **Set Project Names**: Always set `PLAYWRIGHT_PROJECT` for meaningful metrics
2. **Monitor Retries**: High retry rates indicate flaky tests
3. **Set Alerts**: Configure alerts for performance degradation
4. **Regular Review**: Review metrics weekly to identify trends
5. **Baseline Comparison**: Compare metrics against historical baselines

## Metrics Schema Reference

| Metric Name | Type | Labels | Description |
|-------------|------|--------|-------------|
| `playwright_test_duration_seconds` | Histogram | test, project, status | Test execution time |
| `playwright_test_retry_total` | Counter | test, project | Number of test retries |
| `playwright_test_duration_seconds_bucket` | Histogram | le, test, project, status | Duration distribution buckets |
| `playwright_test_duration_seconds_sum` | Histogram | test, project, status | Total duration sum |
| `playwright_test_duration_seconds_count` | Histogram | test, project, status | Total test count | 