import type { Reporter, TestCase, TestResult, FullResult } from '@playwright/test/reporter';
import {
  recordTestMetrics,
  recordShardSummary,
  recordDailyRun,
  recordSuiteSummary,
  recordTestStatusCount
} from './metrics';
import { flushMetrics } from './metrics-client';

interface TestResultData {
  duration: number;
  status: string;
  retries: number;
  assertionErrors: number;
  testName: string;
}

class InfluxReporter implements Reporter {
  private shard = process.env.SHARD || "1";
  private suite = process.env.SUITE || "default";
  private workers = parseInt(process.env.WORKERS || "1");

  private testResults: TestResultData[] = [];
  private testHistory: Map<string, { total: number; failures: number }> = new Map();

  onTestEnd(test: TestCase, result: TestResult) {
    const duration = result.duration / 1000; // ms → sec

    // Count assertion errors from error messages
    const assertionErrors = this.countAssertionErrors(result.error?.message);

    // Calculate flakiness ratio based on test history
    const flakinessRatio = this.calculateFlakinessRatio(test.title);

    // Update test history
    this.updateTestHistory(test.title, result.status);

    // Record test metrics
    recordTestMetrics(
      test.title,
      this.shard,
      duration,
      result.retry,
      result.status,
      assertionErrors,
      flakinessRatio
    );

    // Record test status count for aggregation
    recordTestStatusCount(test.title, result.status);

    this.testResults.push({
      duration,
      status: result.status,
      retries: result.retry,
      assertionErrors,
      testName: test.title
    });
  }

  async onEnd(result: FullResult) {
    // Calculate shard-level aggregates
    const total = this.testResults.length;
    const pass = this.testResults.filter(r => r.status === 'passed').length;
    const fail = this.testResults.filter(r => r.status === 'failed').length;
    const skip = this.testResults.filter(r => r.status === 'skipped').length;
    const retries = this.testResults.reduce((sum, r) => sum + r.retries, 0);
    const avgDuration = this.testResults.reduce((sum, r) => sum + r.duration, 0) / (total || 1);
    const slowestTestDuration = Math.max(...this.testResults.map(r => r.duration), 0);

    // Calculate flakiness hotspots (tests that failed 2+ times in this run)
    const flakinessHotspots = this.testResults
      .filter(r => r.status === 'failed' && r.retries >= 1).length;

    // Record shard summary with enhanced metrics
    recordShardSummary(
      this.shard,
      total,
      pass,
      fail,
      skip,
      retries,
      avgDuration,
      this.workers,
      slowestTestDuration
    );

    // Record suite summary
    recordSuiteSummary(
      this.suite,
      total,
      pass,
      fail,
      skip,
      avgDuration,
      retries,
      flakinessHotspots
    );



    // Legacy daily run record
    recordDailyRun("qa-suite");

    await flushMetrics(); // flush writes before exit
  }

  private countAssertionErrors(error?: string): number {
    if (!error) return 0;

    // Count common assertion error patterns
    const assertionPatterns = [
      /expect\(/gi,
      /assert\(/gi,
      /toBe\(/gi,
      /toEqual\(/gi,
      /toContain\(/gi,
      /toHaveText\(/gi,
      /toHaveValue\(/gi
    ];

    return assertionPatterns.reduce((count, pattern) => {
      const matches = error.match(pattern);
      return count + (matches ? matches.length : 0);
    }, 0);
  }

  private updateTestHistory(testName: string, status: string): void {
    const current = this.testHistory.get(testName) || { total: 0, failures: 0 };
    current.total++;
    if (status === 'failed') {
      current.failures++;
    }
    this.testHistory.set(testName, current);
  }

  private calculateFlakinessRatio(testName: string): number {
    const history = this.testHistory.get(testName);
    if (!history || history.total === 0) return 0;

    return (history.failures / history.total) * 100;
  }
}

export default InfluxReporter;
