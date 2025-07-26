# Grafana Cloud Setup Guide (Service Account)

## 🎯 Step-by-Step Setup

### 1. Create Grafana Cloud Account
- Go to: https://grafana.com/auth/sign-up/create-user
- Choose the **FREE** plan (includes 3 users, 10k series, 14 days retention)
- Complete the signup process

### 2. Create Service Account
1. Log into Grafana Cloud
2. Go to **Configuration** → **Service Accounts**
3. Click **Add service account**
4. Fill in:
   - **Name**: `playwright-metrics`
   - **Display name**: `Playwright Test Metrics`
   - **Description**: `Service account for Playwright test metrics`
5. Click **Create**

### 3. Add Service Account Token
1. Click on your new service account
2. Go to **Tokens** tab
3. Click **Add token**
4. Fill in:
   - **Name**: `playwright-metrics-token`
   - **Role**: **MetricsPublisher**
5. Click **Create**
6. **IMPORTANT**: Copy the token immediately (you won't see it again!)

### 4. Get Your Grafana Cloud URL
1. Go to **Configuration** → **Data Sources**
2. Click on **Prometheus**
3. Note the **URL** (this is your Grafana Cloud URL)

### 5. Update Configuration
Update `config.env` with your credentials:

```env
GRAFANA_CLOUD_URL=https://your-instance.grafana.net
GRAFANA_CLOUD_SERVICE_ACCOUNT_TOKEN=your-service-account-token-here
```

### 6. Test the Setup
```bash
npm run test-grafana
```

### 7. Send Metrics
```bash
npm run send-metrics
```

## 📊 Dashboard Creation

### Dashboard 1: Test Execution Overview
**Panel 1: Pass/Fail Rate**
- Query: `rate(playwright_test_results_total{status="passed"}[5m]) / rate(playwright_test_results_total[5m]) * 100`
- Visualization: Stat
- Title: "Pass Rate %"

**Panel 2: Test Duration**
- Query: `playwright_test_duration_seconds`
- Visualization: Time series
- Title: "Test Duration by Project"

**Panel 3: Test Counts**
- Query: `playwright_test_results_total`
- Visualization: Pie chart
- Title: "Tests by Status"

### Dashboard 2: Performance Analysis
**Panel 1: Slowest Tests**
- Query: `topk(10, playwright_test_duration_seconds)`
- Visualization: Table
- Title: "Top 10 Slowest Tests"

**Panel 2: Project Comparison**
- Query: `avg(playwright_test_duration_seconds) by (project)`
- Visualization: Bar chart
- Title: "Average Duration by Project"

## 📊 Sample Dashboard Queries

### Basic Metrics
```promql
# Total test results
playwright_test_results_total

# Test duration
playwright_test_duration_seconds

# Pass rate
rate(playwright_test_results_total{status="passed"}[5m]) / rate(playwright_test_results_total[5m]) * 100
```

### Advanced Analytics
```promql
# Average duration by project
avg(playwright_test_duration_seconds) by (project)

# Tests per suite
sum(playwright_test_results_total) by (suite)

# Performance trend
rate(playwright_test_duration_seconds[5m])
```

## 🔧 Troubleshooting

### Common Issues:
1. **"Failed to send metrics"**
   - Check service account token permissions
   - Verify Grafana Cloud URL
   - Ensure token has MetricsPublisher role

2. **"No data in dashboard"**
   - Run tests first: `npm run test:with-metrics`
   - Send metrics: `npm run send-metrics`
   - Check data source configuration

3. **"Authentication failed"**
   - Regenerate service account token
   - Check URL format (should start with https://)
   - Verify token hasn't expired

## 📈 Next Steps After Setup

1. **Create Alerts** for:
   - Pass rate < 95%
   - Test duration > 10 seconds
   - New test failures

2. **Set up Notifications** via:
   - Email
   - Slack
   - Teams

3. **Build Custom Dashboards** for:
   - Team performance
   - Sprint metrics
   - Release quality

## 🎯 Benefits You'll Get

- **Real-time test monitoring**
- **Historical trend analysis**
- **Performance optimization insights**
- **Proactive issue detection**
- **Team productivity metrics**

## 🔐 Security Notes

- Service accounts are more secure than API keys
- Tokens can be easily rotated
- Better permission management
- Audit trail for token usage 