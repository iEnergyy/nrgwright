# Playwright Metrics Dashboard Setup

This setup allows you to collect Playwright test metrics and send them to Grafana Cloud for visualization.

## 🚀 Quick Start

### 1. Configure Grafana Cloud

1. Create a Grafana Cloud account at https://grafana.com/auth/sign-up/create-user
2. Get your API key and instance URL
3. Update `config.env` with your credentials:

```env
GRAFANA_CLOUD_URL=https://your-instance.grafana.net
GRAFANA_CLOUD_API_KEY=your-api-key
```

### 2. Run Tests with Metrics Collection

```bash
npm run test:with-metrics
```

This will:
- Run all Playwright tests
- Collect metrics for each test
- Save metrics to `metrics/playwright-metrics-YYYY-MM-DD.json`
- Display a summary of test execution

### 3. Send Metrics to Grafana Cloud

```bash
npm run send-metrics
```

This will:
- Read the latest metrics file
- Convert to Prometheus format
- Send to Grafana Cloud

## 📊 Metrics Collected

The system collects the following metrics for each test:

- **Test Name**: Name of the test
- **Project**: Browser project (Web-1, Web-2, etc.)
- **Suite**: Test suite name
- **Status**: passed/failed/skipped
- **Duration**: Test execution time in seconds
- **Retries**: Number of retry attempts
- **Timestamp**: When the test was executed

## 📈 Grafana Dashboard Queries

Once metrics are in Grafana Cloud, you can create dashboards with these PromQL queries:

### Pass/Fail Rate
```promql
# Pass rate percentage
rate(playwright_test_results_total{status="passed"}[5m]) / rate(playwright_test_results_total[5m]) * 100

# Fail rate percentage  
rate(playwright_test_results_total{status="failed"}[5m]) / rate(playwright_test_results_total[5m]) * 100
```

### Duration by Project/Test
```promql
# Average duration by project
playwright_test_duration_seconds{project="Web-1"}

# Average duration by test suite
playwright_test_duration_seconds{suite="API Tests"}
```

### Test Counts
```promql
# Total tests by project
playwright_test_results_total{project="Web-1"}

# Tests by status
playwright_test_results_total{status="passed"}
```

## 🛠 Available Scripts

- `npm run test:with-metrics` - Run tests with metrics collection
- `npm run send-metrics` - Send collected metrics to Grafana Cloud
- `npm test` - Run tests without metrics (original behavior)

## 📁 File Structure

```
├── lib/
│   ├── file-metrics-reporter.ts    # Metrics collection reporter
│   └── send-metrics-to-grafana.js  # Script to send metrics to Grafana
├── metrics/
│   └── playwright-metrics-*.json   # Collected metrics files
├── config.env                      # Grafana Cloud configuration
└── README-METRICS.md              # This file
```

## 🔧 Customization

### Adding Custom Metrics

To add custom metrics, modify `lib/file-metrics-reporter.ts`:

```typescript
onTestEnd(test: TestCase, result: TestResult) {
  const metric: TestMetric = {
    // ... existing fields
    custom_field: 'your_custom_value',  // Add custom fields
  };
}
```

### Changing Metrics Format

The metrics are saved as JSON and converted to Prometheus format when sent to Grafana. You can modify the conversion logic in `lib/send-metrics-to-grafana.js`.

## 🚨 Troubleshooting

### No Metrics Collected
- Ensure you're using `npm run test:with-metrics` instead of `npm test`
- Check that the metrics directory is created

### Failed to Send to Grafana
- Verify your Grafana Cloud credentials in `config.env`
- Check that the API key has write permissions
- Ensure the Grafana Cloud URL is correct

### Empty Metrics File
- Run tests first with `npm run test:with-metrics`
- Check that tests are actually executing

## 📈 Next Steps

1. **Set up Grafana Cloud** and get your credentials
2. **Run tests with metrics**: `npm run test:with-metrics`
3. **Send to Grafana**: `npm run send-metrics`
4. **Create dashboard** in Grafana Cloud with the provided queries
5. **Set up alerts** for test failures or performance degradation

## 🎯 Benefits

- **No local server required** - Direct file-based collection
- **All logic in Grafana** - Use Grafana's powerful querying and visualization
- **Historical data** - Metrics are saved locally for analysis
- **Easy setup** - Minimal configuration required
- **Scalable** - Works with any number of tests and projects 