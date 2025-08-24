import type { Reporter, TestCase, TestResult, FullResult } from '@playwright/test/reporter';
import { recordTestMetrics, recordShardSummary, recordDailyRun } from './metrics';
import { flushMetrics } from './metrics-client';

class InfluxReporter implements Reporter {
  private shard = process.env.SHARD || "1";
  private testResults: { duration: number; status: string; retries: number; }[] = [];

  onTestEnd(test: TestCase, result: TestResult) {
    const duration = result.duration / 1000; // ms → sec
    recordTestMetrics(test.title, this.shard, duration, result.retry, result.status);
    this.testResults.push({ duration, status: result.status, retries: result.retry });
  }

  async onEnd(result: FullResult) {
    // aggregate shard summary
    const total = this.testResults.length;
    const pass = this.testResults.filter(r => r.status === 'passed').length;
    const fail = this.testResults.filter(r => r.status === 'failed').length;
    const skip = this.testResults.filter(r => r.status === 'skipped').length;
    const retries = this.testResults.reduce((sum, r) => sum + r.retries, 0);
    const avgDuration = this.testResults.reduce((sum, r) => sum + r.duration, 0) / (total || 1);

    recordShardSummary(this.shard, total, pass, fail, skip, retries, avgDuration);
    recordDailyRun("qa-suite");

    await flushMetrics(); // flush writes before exit
  }
}

export default InfluxReporter;
