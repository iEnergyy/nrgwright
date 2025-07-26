const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { config } = require('dotenv');

// Load environment variables
config({ path: './.env' });

async function sendMetricsToGrafana() {
  const otlpUrl = 'https://otlp-gateway-prod-us-east-2.grafana.net/otlp/v1/metrics';
  const prometheusToken = process.env.PROMETHEUS_TOKEN;
  
  if (!prometheusToken) {
    console.error('❌ Prometheus token not found in .env');
    console.log('💡 Please add:');
    console.log('   PROMETHEUS_TOKEN=your-prometheus-token');
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

    // Convert to OTLP format
    const otlpMetrics = convertToOTLPFormat(metricsData);
    
    console.log(`🚀 Sending metrics to OTLP endpoint: ${otlpUrl}`);
    
    const response = await axios.post(otlpUrl, otlpMetrics, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`1328463:${prometheusToken}`).toString('base64')}`
      }
    });

    console.log('✅ Metrics sent to Grafana Cloud OTLP endpoint successfully!');
    console.log(`📈 View in Grafana Cloud: https://ienergyy.grafana.net`);
    
  } catch (error) {
    console.error('❌ Failed to send metrics:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

function convertToOTLPFormat(metrics) {
  const now = Date.now() * 1000000; // Convert to nanoseconds
  
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

  const otlpMetrics = [];

  // Add test results as gauge metrics
  Object.entries(testResults).forEach(([key, value]) => {
    const [project, suite, testName, status] = key.split('_');
    otlpMetrics.push({
      name: 'playwright_test_results_total',
      unit: '1',
      description: 'Total number of test results by status',
      gauge: {
        dataPoints: [{
          asInt: value,
          timeUnixNano: now,
          attributes: [
            { key: 'project', value: { stringValue: project } },
            { key: 'suite', value: { stringValue: suite } },
            { key: 'test_name', value: { stringValue: testName } },
            { key: 'status', value: { stringValue: status } }
          ]
        }]
      }
    });
  });

  // Add test durations as gauge metrics
  Object.entries(testDurations).forEach(([key, durations]) => {
    const [project, suite, testName] = key.split('_');
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    otlpMetrics.push({
      name: 'playwright_test_duration_seconds',
      unit: 's',
      description: 'Average test duration in seconds',
      gauge: {
        dataPoints: [{
          asDouble: avgDuration,
          timeUnixNano: now,
          attributes: [
            { key: 'project', value: { stringValue: project } },
            { key: 'suite', value: { stringValue: suite } },
            { key: 'test_name', value: { stringValue: testName } }
          ]
        }]
      }
    });
  });

  return {
    resourceMetrics: [{
      scopeMetrics: [{
        metrics: otlpMetrics
      }]
    }]
  };
}

// Run if called directly
if (require.main === module) {
  sendMetricsToGrafana();
}

module.exports = { sendMetricsToGrafana }; 