const axios = require('axios');
const { config } = require('dotenv');

// Load environment variables
config({ path: './.env' });

async function checkMetricsDataSource() {
  const grafanaUrl = process.env.GRAFANA_CLOUD_URL;
  const serviceAccountToken = process.env.GRAFANA_CLOUD_SERVICE_ACCOUNT_TOKEN;
  
  console.log('🔍 Checking where Playwright metrics are stored...\n');
  
  if (!grafanaUrl || !serviceAccountToken) {
    console.error('❌ Missing Grafana Cloud credentials in .env');
    return;
  }

  const headers = {
    'Authorization': `Bearer ${serviceAccountToken}`
  };

  try {
    // Check data sources
    console.log('1️⃣ Checking available data sources...');
    const dsResponse = await axios.get(`${grafanaUrl}/api/datasources`, { headers });
    
    console.log('Available data sources:');
    dsResponse.data.forEach(ds => {
      console.log(`   - ${ds.name} (${ds.type}) - ${ds.url || 'No URL'}`);
    });
    console.log('');

    // Test different data source types for our metrics
    const testQueries = [
      'playwright_daily_runs_total',
      'playwright_test_results_total',
      'playwright_test_duration_seconds'
    ];

    console.log('2️⃣ Testing metrics queries in different data sources...\n');

    for (const ds of dsResponse.data) {
      if (ds.type === 'prometheus' || ds.type === 'grafana-cloud-metrics' || ds.type === 'cloudwatch') {
        console.log(`Testing ${ds.name} (${ds.type}):`);
        
        for (const query of testQueries) {
          try {
            // Try to query the data source
            const queryUrl = `${grafanaUrl}/api/datasources/proxy/${ds.id}/api/v1/query`;
            const queryResponse = await axios.get(queryUrl, {
              headers,
              params: {
                query: query,
                time: Math.floor(Date.now() / 1000)
              }
            });

            if (queryResponse.data.data && queryResponse.data.data.result && queryResponse.data.data.result.length > 0) {
              console.log(`   ✅ ${query} - Found ${queryResponse.data.data.result.length} results`);
            } else {
              console.log(`   ❌ ${query} - No data found`);
            }
          } catch (error) {
            console.log(`   ❌ ${query} - Error: ${error.response?.status || error.message}`);
          }
        }
        console.log('');
      }
    }

    console.log('💡 Recommendations:');
    console.log('1. Use the data source that shows ✅ for your metrics');
    console.log('2. If no data source shows results, check if metrics are being sent correctly');
    console.log('3. Try importing the dashboard with the data source that works');

  } catch (error) {
    console.error('❌ Error checking data sources:', error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Message: ${error.response.statusText}`);
    }
  }
}

// Run if called directly
if (require.main === module) {
  checkMetricsDataSource();
}

module.exports = { checkMetricsDataSource }; 