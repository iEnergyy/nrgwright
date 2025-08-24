import { Point } from '@influxdata/influxdb3-client';
import { writePoint } from './metrics-client';

export function recordTestMetrics(testName: string, shard: string, duration: number, retries: number, status: string) {
  const point = Point.measurement('test_runs')
    .setTag('test_name', testName)
    .setTag('shard', shard)
    .setStringField('status', status)
    .setIntegerField('playwright_test_retry_total', retries)
    .setFloatField('playwright_test_duration_seconds', duration)
    .setTimestamp(new Date());
  writePoint(point);
}

export function recordShardSummary(shard: string, total: number, pass: number, fail: number, skip: number, retries: number, avgDuration: number) {
  const point = Point.measurement('shard_summary')
    .setTag('shard', shard)
    .setIntegerField('total_tests', total)
    .setIntegerField('pass_count', pass)
    .setIntegerField('fail_count', fail)
    .setIntegerField('skip_count', skip)
    .setIntegerField('retry_count', retries)
    .setFloatField('avg_duration', avgDuration)
    .setTimestamp(new Date());
  writePoint(point);
}

export function recordDailyRun(project: string) {
  const point = Point.measurement('daily_summary')
    .setTag('project', project)
    .setIntegerField('playwright_daily_runs_total', 1)
    .setTimestamp(new Date());
  writePoint(point);
}
