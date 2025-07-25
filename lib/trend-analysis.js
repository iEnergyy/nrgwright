const fs = require('fs');
const path = require('path');

function analyzeTrends() {
  const metricsDir = path.join(process.cwd(), 'metrics');
  
  if (!fs.existsSync(metricsDir)) {
    console.error('❌ No metrics directory found.');
    return;
  }

  // Get all metrics files
  const files = fs.readdirSync(metricsDir)
    .filter(file => file.startsWith('playwright-metrics-') && file.endsWith('.json'))
    .sort();

  if (files.length < 2) {
    console.log('📊 Need at least 2 test runs to analyze trends. Run more tests!');
    return;
  }

  console.log(`📈 Analyzing trends across ${files.length} test runs\n`);

  const trends = [];
  
  files.forEach(file => {
    const metrics = JSON.parse(fs.readFileSync(path.join(metricsDir, file), 'utf8'));
    const date = file.replace('playwright-metrics-', '').replace('.json', '');
    
    const totalTests = metrics.length;
    const passedTests = metrics.filter(m => m.status === 'passed').length;
    const totalDuration = metrics.reduce((sum, m) => sum + m.duration_seconds, 0);
    const avgDuration = totalDuration / totalTests;
    const passRate = (passedTests / totalTests) * 100;

    trends.push({
      date,
      totalTests,
      passedTests,
      failedTests: totalTests - passedTests,
      avgDuration,
      totalDuration,
      passRate
    });
  });

  // Display trends
  console.log('📊 TEST EXECUTION TRENDS');
  console.log('='.repeat(80));
  console.log('Date       | Tests | Passed | Failed | Pass Rate | Avg Duration | Total Duration');
  console.log('-'.repeat(80));
  
  trends.forEach(trend => {
    console.log(`${trend.date} | ${trend.totalTests.toString().padStart(5)} | ${trend.passedTests.toString().padStart(6)} | ${trend.failedTests.toString().padStart(6)} | ${trend.passRate.toFixed(1).padStart(8)}% | ${trend.avgDuration.toFixed(2).padStart(11)}s | ${trend.totalDuration.toFixed(2).padStart(13)}s`);
  });

  // Calculate improvements/regressions
  if (trends.length >= 2) {
    const first = trends[0];
    const last = trends[trends.length - 1];
    
    console.log('\n🔄 PERFORMANCE CHANGES (First vs Latest Run)');
    console.log('='.repeat(50));
    
    const durationChange = ((last.avgDuration - first.avgDuration) / first.avgDuration) * 100;
    const passRateChange = last.passRate - first.passRate;
    const testCountChange = last.totalTests - first.totalTests;
    
    console.log(`Test Count: ${first.totalTests} → ${last.totalTests} (${testCountChange > 0 ? '+' : ''}${testCountChange})`);
    console.log(`Pass Rate: ${first.passRate.toFixed(1)}% → ${last.passRate.toFixed(1)}% (${passRateChange > 0 ? '+' : ''}${passRateChange.toFixed(1)}%)`);
    console.log(`Avg Duration: ${first.avgDuration.toFixed(2)}s → ${last.avgDuration.toFixed(2)}s (${durationChange > 0 ? '+' : ''}${durationChange.toFixed(1)}%)`);
    
    if (durationChange > 10) {
      console.log('⚠️  WARNING: Test duration increased significantly!');
    } else if (durationChange < -10) {
      console.log('✅ IMPROVEMENT: Test duration decreased significantly!');
    }
    
    if (passRateChange < -5) {
      console.log('⚠️  WARNING: Pass rate decreased significantly!');
    } else if (passRateChange > 5) {
      console.log('✅ IMPROVEMENT: Pass rate increased significantly!');
    }
  }

  // Predictions
  console.log('\n🔮 PREDICTIONS (Based on trends)');
  console.log('='.repeat(50));
  
  if (trends.length >= 3) {
    const recentTrends = trends.slice(-3);
    const avgDurationTrend = recentTrends.map(t => t.avgDuration);
    const avgChange = (avgDurationTrend[avgDurationTrend.length - 1] - avgDurationTrend[0]) / (avgDurationTrend.length - 1);
    
    if (avgChange > 0.5) {
      console.log('📈 Trend: Test duration is increasing - consider optimization');
    } else if (avgChange < -0.5) {
      console.log('📉 Trend: Test duration is decreasing - good optimization!');
    } else {
      console.log('📊 Trend: Test duration is stable');
    }
  }
}

// Run if called directly
if (require.main === module) {
  analyzeTrends();
}

module.exports = { analyzeTrends }; 