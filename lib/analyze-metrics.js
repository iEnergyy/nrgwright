const fs = require('fs');
const path = require('path');

function analyzeMetrics() {
  const metricsDir = path.join(process.cwd(), 'metrics');
  
  if (!fs.existsSync(metricsDir)) {
    console.error('❌ No metrics directory found. Run tests first with: npm run test:with-metrics');
    return;
  }

  // Find the most recent metrics file
  const files = fs.readdirSync(metricsDir)
    .filter(file => file.startsWith('playwright-metrics-') && file.endsWith('.json'))
    .sort()
    .reverse();

  if (files.length === 0) {
    console.error('❌ No metrics files found. Run tests first with: npm run test:with-metrics');
    return;
  }

  const latestFile = path.join(metricsDir, files[0]);
  const metrics = JSON.parse(fs.readFileSync(latestFile, 'utf8'));

  console.log(`📊 Analyzing ${metrics.length} test metrics from ${files[0]}\n`);

  // Basic statistics
  const totalTests = metrics.length;
  const passedTests = metrics.filter(m => m.status === 'passed').length;
  const failedTests = metrics.filter(m => m.status === 'failed').length;
  const skippedTests = metrics.filter(m => m.status === 'skipped').length;
  
  const totalDuration = metrics.reduce((sum, m) => sum + m.duration_seconds, 0);
  const avgDuration = totalDuration / totalTests;
  const maxDuration = Math.max(...metrics.map(m => m.duration_seconds));
  const minDuration = Math.min(...metrics.map(m => m.duration_seconds));

  // Performance by project
  const projectStats = {};
  metrics.forEach(m => {
    if (!projectStats[m.project]) {
      projectStats[m.project] = { count: 0, totalDuration: 0, passed: 0, failed: 0 };
    }
    projectStats[m.project].count++;
    projectStats[m.project].totalDuration += m.duration_seconds;
    if (m.status === 'passed') projectStats[m.project].passed++;
    if (m.status === 'failed') projectStats[m.project].failed++;
  });

  // Test suite analysis
  const suiteStats = {};
  metrics.forEach(m => {
    const suite = m.suite;
    if (!suiteStats[suite]) {
      suiteStats[suite] = { count: 0, totalDuration: 0, passed: 0, failed: 0 };
    }
    suiteStats[suite].count++;
    suiteStats[suite].totalDuration += m.duration_seconds;
    if (m.status === 'passed') suiteStats[suite].passed++;
    if (m.status === 'failed') suiteStats[suite].failed++;
  });

  // Slowest tests
  const slowestTests = [...metrics]
    .sort((a, b) => b.duration_seconds - a.duration_seconds)
    .slice(0, 10);

  // Fastest tests
  const fastestTests = [...metrics]
    .sort((a, b) => a.duration_seconds - b.duration_seconds)
    .slice(0, 10);

  // Display results
  console.log('🎯 OVERALL STATISTICS');
  console.log('='.repeat(50));
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests} (${((passedTests/totalTests)*100).toFixed(1)}%)`);
  console.log(`Failed: ${failedTests} (${((failedTests/totalTests)*100).toFixed(1)}%)`);
  console.log(`Skipped: ${skippedTests} (${((skippedTests/totalTests)*100).toFixed(1)}%)`);
  console.log(`Total Duration: ${totalDuration.toFixed(2)}s`);
  console.log(`Average Duration: ${avgDuration.toFixed(2)}s`);
  console.log(`Fastest Test: ${minDuration.toFixed(2)}s`);
  console.log(`Slowest Test: ${maxDuration.toFixed(2)}s`);

  console.log('\n📊 PERFORMANCE BY PROJECT');
  console.log('='.repeat(50));
  Object.entries(projectStats).forEach(([project, stats]) => {
    const avgDuration = stats.totalDuration / stats.count;
    const passRate = ((stats.passed / stats.count) * 100).toFixed(1);
    console.log(`${project}:`);
    console.log(`  Tests: ${stats.count} | Pass Rate: ${passRate}% | Avg Duration: ${avgDuration.toFixed(2)}s`);
  });

  console.log('\n📊 PERFORMANCE BY SUITE');
  console.log('='.repeat(50));
  Object.entries(suiteStats).forEach(([suite, stats]) => {
    const avgDuration = stats.totalDuration / stats.count;
    const passRate = ((stats.passed / stats.count) * 100).toFixed(1);
    console.log(`${suite}:`);
    console.log(`  Tests: ${stats.count} | Pass Rate: ${passRate}% | Avg Duration: ${avgDuration.toFixed(2)}s`);
  });

  console.log('\n🐌 SLOWEST TESTS (Top 10)');
  console.log('='.repeat(50));
  slowestTests.forEach((test, index) => {
    console.log(`${index + 1}. ${test.test_name}`);
    console.log(`   Duration: ${test.duration_seconds.toFixed(2)}s | Project: ${test.project} | Status: ${test.status}`);
  });

  console.log('\n⚡ FASTEST TESTS (Top 10)');
  console.log('='.repeat(50));
  fastestTests.forEach((test, index) => {
    console.log(`${index + 1}. ${test.test_name}`);
    console.log(`   Duration: ${test.duration_seconds.toFixed(2)}s | Project: ${test.project} | Status: ${test.status}`);
  });

  // Performance insights
  console.log('\n💡 PERFORMANCE INSIGHTS');
  console.log('='.repeat(50));
  
  const slowTests = metrics.filter(m => m.duration_seconds > avgDuration * 2);
  if (slowTests.length > 0) {
    console.log(`⚠️  ${slowTests.length} tests are significantly slower than average (>${(avgDuration * 2).toFixed(1)}s)`);
  }

  const fastTests = metrics.filter(m => m.duration_seconds < avgDuration * 0.5);
  if (fastTests.length > 0) {
    console.log(`✅ ${fastTests.length} tests are significantly faster than average (<${(avgDuration * 0.5).toFixed(1)}s)`);
  }

  // Project comparison
  const projects = Object.keys(projectStats);
  if (projects.length > 1) {
    const projectDurations = projects.map(p => ({
      project: p,
      avgDuration: projectStats[p].totalDuration / projectStats[p].count
    }));
    const fastestProject = projectDurations.reduce((a, b) => a.avgDuration < b.avgDuration ? a : b);
    const slowestProject = projectDurations.reduce((a, b) => a.avgDuration > b.avgDuration ? a : b);
    
    console.log(`\n🔄 PROJECT COMPARISON:`);
    console.log(`Fastest: ${fastestProject.project} (${fastestProject.avgDuration.toFixed(2)}s avg)`);
    console.log(`Slowest: ${slowestProject.project} (${slowestProject.avgDuration.toFixed(2)}s avg)`);
  }

  console.log('\n📈 NEXT STEPS:');
  console.log('1. Run more tests to build historical data: npm run test:with-metrics');
  console.log('2. Set up Grafana Cloud for real-time dashboards');
  console.log('3. Create alerts for slow tests or failures');
  console.log('4. Optimize slow tests based on insights above');
}

// Run if called directly
if (require.main === module) {
  analyzeMetrics();
}

module.exports = { analyzeMetrics }; 