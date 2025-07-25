const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { config } = require('dotenv');

// Load environment variables
config({ path: './config.env' });

async function sendMetricsToGrafana() {
  const grafanaUrl = process.env.GRAFANA_CLOUD_URL;
  const apiKey = process.env.GRAFANA_CLOUD_API_KEY;
  
  if (!grafanaUrl || !apiKey) {
    console.error('❌ Grafana Cloud credentials not found in config.env');
    console.log('💡 Please add:');
    console.log('   GRAFANA_CLOUD_URL=https://your-instance.grafana.net');
    console.log('   GRAFANA_CLOUD_API_KEY=your-api-key');
    return;
  }

  const metricsDir = path.join(process.cwd(), 'metrics');
  
  if (!fs.existsSync(metricsDir)) {
    console.error('❌ No metrics directory found. Run tests first with metrics collection.');
    return;
  }

  // Find the most recent metrics file
  const files = fs.readdirSync(metricsDir)
    .filter(file => file.startsWith('playwright-metrics-') && file.endsWith('.json'))
    .sort()
    .reverse();

  if (files.length === 0) {
    console.error('❌ No metrics files found. Run tests first with metrics collection.');
    return;
  }

  const latestFile = path.join(metricsDir, files[0]);
  console.log(`📁 Reading metrics from: ${latestFile}`);

  try {
    const metricsData = JSON.parse(fs.readFileSync(latestFile, 'utf8'));
    console.log(`📊 Found ${metricsData.length} test metrics`);

    // Convert to Prometheus format
    const prometheusMetrics = convertToPrometheusFormat(metricsData);
    
    // Send to Grafana Cloud
    const response = await axios.post(
      `${grafanaUrl}/api/prom/push`,
      prometheusMetrics,
      {
        headers: {
          'Content-Type': 'text/plain',
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );

    console.log('✅ Metrics sent to Grafana Cloud successfully!');
    console.log(`📈 View in Grafana Cloud: ${grafanaUrl}`);
    
  } catch (error) {
    console.error('❌ Failed to send metrics:', error.message);
  }
}

function convertToPrometheusFormat(metrics) {
  let prometheusData = '';
  
  // Group metrics by type
  const testResults = metrics.reduce((acc, metric) => {
    const key = `${metric.project}_${metric.suite}_${metric.test_name}_${metric.status}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const testDurations = metrics.reduce((acc, metric) => {
    const key = `${metric.project}_${metric.suite}_${metric.test_name}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(metric.duration_seconds);
    return acc;
  }, {});

  // Convert to Prometheus format
  Object.entries(testResults).forEach(([key, value]) => {
    const [project, suite, testName, status] = key.split('_');
    prometheusData += `playwright_test_results_total{project="${project}",suite="${suite}",test_name="${testName}",status="${status}"} ${value}\n`;
  });

  Object.entries(testDurations).forEach(([key, durations]) => {
    const [project, suite, testName] = key.split('_');
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    prometheusData += `playwright_test_duration_seconds{project="${project}",suite="${suite}",test_name="${testName}"} ${avgDuration}\n`;
  });

  return prometheusData;
}

// Run if called directly
if (require.main === module) {
  sendMetricsToGrafana();
}

module.exports = { sendMetricsToGrafana }; 