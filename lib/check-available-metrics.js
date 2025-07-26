const axios = require('axios');
const { config } = require('dotenv');

// Load environment variables
config({ path: './.env' });

async function checkAvailableMetrics() {
  const grafanaUrl = process.env.GRAFANA_CLOUD_URL;
  const serviceAccountToken = process.env.GRAFANA_CLOUD_SERVICE_ACCOUNT_TOKEN;
  
  console.log('🔍 Checking available Playwright metrics...\n');
  
  if (!grafanaUrl || !serviceAccountToken) {
    console.error('❌ Missing Grafana Cloud credentials in .env');
    return;
  }

  const headers = {
    'Authorization': `Bearer ${serviceAccountToken}`
  };

  try {
    // Get the Prometheus data source ID
    console.log('1️⃣ Getting data source information...');
    const dsResponse = await axios.get(`${grafanaUrl}/api/datasources`, { headers });
    const prometheusDS = dsResponse.data.find(ds => ds.name === 'grafanacloud-ienergyy-prom');
    
    if (!prometheusDS) {
      console.error('❌ Prometheus data source not found');
      return;
    }

    console.log(`✅ Found Prometheus data source: ${prometheusDS.name} (ID: ${prometheusDS.id})`);
    console.log('');

    // Get available metric names
    console.log('2️⃣ Getting available metric names...');
    const metricsResponse = await axios.get(
      `${grafanaUrl}/api/datasources/proxy/${prometheusDS.id}/api/v1/label/__name__/values`,
      { headers }
    );

    const playwrightMetrics = metricsResponse.data.data.filter(metric => 
      metric.includes('playwright')
    );

    console.log('Available Playwright metrics:');
    playwrightMetrics.forEach(metric => {
      console.log(`   - ${metric}`);
    });
    console.log('');

    // Test each metric with a sample query
    console.log('3️⃣ Testing metric queries...');
    for (const metric of playwrightMetrics) {
      try {
        const queryResponse = await axios.get(
          `${grafanaUrl}/api/datasources/proxy/${prometheusDS.id}/api/v1/query`,
          {
            headers,
            params: {
              query: metric,
              time: Math.floor(Date.now() / 1000)
            }
          }
        );

        const resultCount = queryResponse.data.data.result?.length || 0;
        console.log(`   ✅ ${metric} - ${resultCount} results`);
      } catch (error) {
        console.log(`   ❌ ${metric} - Error: ${error.response?.status || error.message}`);
      }
    }

    console.log('\n💡 Dashboard Recommendations:');
    console.log('1. Use the metrics that show ✅ results');
    console.log('2. For daily runs, use count() aggregation on existing metrics');
    console.log('3. Update dashboard queries to use available metrics');

  } catch (error) {
    console.error('❌ Error checking metrics:', error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Message: ${error.response.statusText}`);
    }
  }
}

// Run if called directly
if (require.main === module) {
  checkAvailableMetrics();
}

module.exports = { checkAvailableMetrics }; 