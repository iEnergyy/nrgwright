import { Point } from '@influxdata/influxdb-client';
import { writePoint } from './metrics-client';

export function recordTestMetrics(testName: string, shard: string, duration: number, retries: number, status: string) {
  const point = new Point('test_runs')
    .tag('test_name', testName)
    .tag('shard', shard)
    .stringField('status', status)
    .intField('playwright_test_retry_total', retries)
    .floatField('playwright_test_duration_seconds', duration)
    .timestamp(new Date());
  writePoint(point);
}

export function recordShardSummary(shard: string, total: number, pass: number, fail: number, skip: number, retries: number, avgDuration: number) {
  const point = new Point('shard_summary')
    .tag('shard', shard)
    .intField('total_tests', total)
    .intField('pass_count', pass)
    .intField('fail_count', fail)
    .intField('skip_count', skip)
    .intField('retry_count', retries)
    .floatField('avg_duration', avgDuration)
    .timestamp(new Date());
  writePoint(point);
}

export function recordDailyRun(project: string) {
  const point = new Point('daily_summary')
    .tag('project', project)
    .intField('playwright_daily_runs_total', 1)
    .timestamp(new Date());
  writePoint(point);
}
