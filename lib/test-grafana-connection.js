const axios = require('axios');
const { config } = require('dotenv');

// Load environment variables
config({ path: './.env' });

async function testGrafanaConnection() {
  const grafanaUrl = process.env.GRAFANA_CLOUD_URL;
  const serviceAccountToken = process.env.GRAFANA_CLOUD_SERVICE_ACCOUNT_TOKEN;
  const apiKey = process.env.GRAFANA_CLOUD_API_KEY;
  
  console.log('🔍 Testing Grafana Cloud Connection...\n');
  
  if (!grafanaUrl) {
    console.error('❌ Missing Grafana Cloud URL in .env');
    console.log('💡 Please add: GRAFANA_CLOUD_URL=https://your-instance.grafana.net');
    return;
  }

  // Use API key if available, otherwise use service account token
  const authToken = apiKey || serviceAccountToken;
  const authType = apiKey ? 'API Key' : 'Service Account Token';
  
  if (!authToken) {
    console.error('❌ Missing authentication credentials in .env');
    console.log('💡 Please add either:');
    console.log('   GRAFANA_CLOUD_API_KEY=your-api-key (recommended)');
    console.log('   GRAFANA_CLOUD_SERVICE_ACCOUNT_TOKEN=your-service-account-token');
    return;
  }

  console.log(`📡 Grafana URL: ${grafanaUrl}`);
  console.log(`🔑 ${authType}: ${authToken.substring(0, 10)}...${authToken.substring(authToken.length - 4)}`);
  console.log('');

  try {
    // Test 1: Check if we can reach Grafana
    console.log('1️⃣ Testing basic connectivity...');
    const healthResponse = await axios.get(`${grafanaUrl}/api/health`, {
      headers: {
        'Authorization': `Bearer ${serviceAccountToken}`
      }
    });
    console.log('✅ Grafana Cloud is reachable');
    console.log(`   Status: ${healthResponse.status}`);
    console.log(`   Version: ${healthResponse.data.version || 'Unknown'}`);

    // Test 2: Check API key permissions
    console.log('\n2️⃣ Testing API key permissions...');
    const userResponse = await axios.get(`${grafanaUrl}/api/user`, {
      headers: {
        'Authorization': `Bearer ${serviceAccountToken}`
      }
    });
    console.log('✅ API key is valid');
    console.log(`   User: ${userResponse.data.login || 'Unknown'}`);
    console.log(`   Role: ${userResponse.data.role || 'Unknown'}`);

    // Test 3: Test Prometheus remote write endpoint
    console.log('\n3️⃣ Testing Prometheus remote write...');
    const testMetrics = `playwright_test_connection_test{test="connection"} 1\n`;
    
    // Try different Grafana Cloud Prometheus endpoints
    const endpoints = [
      'https://prometheus-prod-56-prod-us-east-2.grafana.net/api/prom/push',
      `${grafanaUrl}/api/v1/push`,
      `${grafanaUrl}/api/prom/push`,
      `${grafanaUrl}/api/prometheus/push`
    ];
    
    let promResponse = null;
    let workingEndpoint = null;
    
    for (const endpoint of endpoints) {
      try {
        console.log(`   Trying endpoint: ${endpoint}`);
        promResponse = await axios.post(endpoint, testMetrics, {
          headers: {
            'Content-Type': 'text/plain',
            'Authorization': `Bearer ${serviceAccountToken}`
          }
        });
        workingEndpoint = endpoint;
        break;
      } catch (error) {
        if (error.response && error.response.status === 404) {
          console.log(`   ❌ 404 Not Found`);
          continue;
        } else {
          throw error;
        }
      }
    }
    
    if (workingEndpoint) {
      console.log('✅ Prometheus remote write is working');
      console.log(`   Endpoint: ${workingEndpoint}`);
      console.log(`   Status: ${promResponse.status}`);
    } else {
      throw new Error('No working Prometheus remote write endpoint found');
    }

    // Test 4: Check data sources
    console.log('\n4️⃣ Checking data sources...');
    const dsResponse = await axios.get(`${grafanaUrl}/api/datasources`, {
      headers: {
        'Authorization': `Bearer ${serviceAccountToken}`
      }
    });
    
    const prometheusDs = dsResponse.data.find(ds => ds.type === 'prometheus');
    if (prometheusDs) {
      console.log('✅ Prometheus data source found');
      console.log(`   Name: ${prometheusDs.name}`);
      console.log(`   URL: ${prometheusDs.url}`);
    } else {
      console.log('⚠️  Prometheus data source not found');
    }

    console.log('\n🎉 All tests passed! Your Grafana Cloud setup is working correctly.');
    console.log('\n📊 Next steps:');
    console.log('1. Run tests with metrics: npm run test:with-metrics');
    console.log('2. Send metrics to Grafana: npm run send-metrics');
    console.log('3. Create dashboards in Grafana Cloud');
    console.log(`4. Visit: ${grafanaUrl}`);

  } catch (error) {
    console.error('\n❌ Connection test failed:');
    
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Message: ${error.response.statusText}`);
      
      if (error.response.status === 401) {
        console.error('   🔑 Invalid service account token - check your credentials');
      } else if (error.response.status === 403) {
        console.error('   🚫 Insufficient permissions - check service account token role');
      } else if (error.response.status === 404) {
        console.error('   🔗 Invalid URL - check your Grafana Cloud URL');
      }
    } else if (error.code === 'ENOTFOUND') {
      console.error('   🌐 Cannot reach Grafana Cloud - check your internet connection');
    } else {
      console.error(`   Error: ${error.message}`);
    }
    
    console.log('\n💡 Troubleshooting:');
    console.log('1. Verify your Grafana Cloud URL is correct');
    console.log('2. Check that your service account token has MetricsPublisher role');
    console.log('3. Ensure your service account token is not expired');
    console.log('4. Try regenerating your service account token');
  }
}

// Run if called directly
if (require.main === module) {
  testGrafanaConnection();
}

module.exports = { testGrafanaConnection }; 