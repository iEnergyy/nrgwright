import { Point } from '@influxdata/influxdb3-client';
import { writePoint } from './metrics-client';

// Test-level metrics (test_run measurement)
export function recordTestMetrics(
  testName: string,
  shard: string,
  duration: number,
  retries: number,
  status: string,
  assertionErrors: number = 0,
  flakinessRatio: number = 0
) {
  const point = Point.measurement('test_run')
    .setTag('test_name', testName)
    .setTag('shard', shard)
    .setStringField('status', status)
    .setIntegerField('playwright_test_retry_total', retries)
    .setFloatField('playwright_test_duration_seconds', duration)
    .setIntegerField('playwright_test_assertion_errors', assertionErrors)
    .setFloatField('playwright_test_flakiness_ratio', flakinessRatio)
    .setTimestamp(new Date());
  writePoint(point);
}

// Test status counter (for aggregating pass/fail/skip counts)
export function recordTestStatusCount(testName: string, status: string, count: number = 1) {
  const point = Point.measurement('test_run')
    .setTag('test_name', testName)
    .setStringField('status', status)
    .setIntegerField('playwright_test_status_total', count)
    .setTimestamp(new Date());
  writePoint(point);
}

// Shard-level metrics (shard_summary measurement)
export function recordShardSummary(
  shard: string,
  total: number,
  pass: number,
  fail: number,
  skip: number,
  retries: number,
  avgDuration: number,
  parallelism: number = 1,
  slowestTestDuration: number = 0
) {
  const failRate = total > 0 ? (fail / total) * 100 : 0;

  const point = Point.measurement('shard_summary')
    .setTag('shard', shard)
    .setIntegerField('total_tests', total)
    .setIntegerField('pass_count', pass)
    .setIntegerField('fail_count', fail)
    .setIntegerField('skip_count', skip)
    .setIntegerField('playwright_shard_retry_total', retries)
    .setFloatField('playwright_shard_avg_duration_seconds', avgDuration)
    .setIntegerField('playwright_shard_parallelism', parallelism)
    .setFloatField('playwright_shard_fail_rate', failRate)
    .setFloatField('playwright_shard_slowest_test_duration', slowestTestDuration)
    .setTimestamp(new Date());
  writePoint(point);
}

// Suite-level metrics (suite_summary measurement)
export function recordSuiteSummary(
  suite: string,
  total: number,
  pass: number,
  fail: number,
  skip: number,
  avgDuration: number,
  reruns: number,
  flakinessHotspots: number = 0
) {
  const passRate = total > 0 ? (pass / total) * 100 : 0;

  const point = Point.measurement('suite_summary')
    .setTag('suite', suite)
    .setIntegerField('total_tests', total)
    .setIntegerField('pass_count', pass)
    .setIntegerField('fail_count', fail)
    .setIntegerField('skip_count', skip)
    .setFloatField('playwright_suite_pass_rate', passRate)
    .setFloatField('playwright_suite_avg_duration_seconds', avgDuration)
    .setIntegerField('playwright_suite_reruns_total', reruns)
    .setIntegerField('playwright_suite_skips_total', skip)
    .setIntegerField('playwright_suite_flakiness_hotspots', flakinessHotspots)
    .setTimestamp(new Date());
  writePoint(point);
}



// Legacy function for backward compatibility
export function recordDailyRun(project: string) {
  const point = Point.measurement('daily_summary')
    .setTag('project', project)
    .setIntegerField('playwright_daily_runs_total', 1)
    .setTimestamp(new Date());
  writePoint(point);
}
