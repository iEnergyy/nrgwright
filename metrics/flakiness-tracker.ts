import fs from 'fs';
import path from 'path';

interface TestHistoryEntry {
  timestamp: string;
  status: string;
  duration: number;
  retries: number;
  assertionErrors: number;
  shard: string;
}

interface TestHistory {
  [testName: string]: TestHistoryEntry[];
}

export class FlakinessTracker {
  private historyFile: string;
  private history: TestHistory = {};
  private maxHistoryDays: number;

  constructor(historyFile: string = 'test-history.json', maxHistoryDays: number = 30) {
    this.historyFile = historyFile;
    this.maxHistoryDays = maxHistoryDays;
    this.loadHistory();
  }

  /**
   * Add a test result to the history
   */
  addTestResult(
    testName: string,
    status: string,
    duration: number,
    retries: number,
    assertionErrors: number,
    shard: string
  ): void {
    if (!this.history[testName]) {
      this.history[testName] = [];
    }

    const entry: TestHistoryEntry = {
      timestamp: new Date().toISOString(),
      status,
      duration,
      retries,
      assertionErrors,
      shard
    };

    this.history[testName].push(entry);
    this.cleanupOldEntries();
    this.saveHistory();
  }

  /**
   * Calculate flakiness ratio for a test over a given time period
   */
  calculateFlakinessRatio(testName: string, days: number = 7): number {
    const entries = this.getRecentEntries(testName, days);
    if (entries.length === 0) return 0;

    const failures = entries.filter(entry => entry.status === 'failed').length;
    return (failures / entries.length) * 100;
  }

  /**
   * Get tests that are considered flaky (failure rate > threshold)
   */
  getFlakyTests(threshold: number = 20, days: number = 7): Array<{ testName: string; flakinessRatio: number }> {
    const flakyTests: Array<{ testName: string; flakinessRatio: number }> = [];

    for (const testName of Object.keys(this.history)) {
      const ratio = this.calculateFlakinessRatio(testName, days);
      if (ratio > threshold) {
        flakyTests.push({ testName, flakinessRatio: ratio });
      }
    }

    return flakyTests.sort((a, b) => b.flakinessRatio - a.flakinessRatio);
  }

  /**
   * Get tests that failed multiple times in the last 24 hours
   */
  getFlakinessHotspots(hours: number = 24): string[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    const hotspots: string[] = [];

    for (const [testName, entries] of Object.entries(this.history)) {
      const recentFailures = entries.filter(entry =>
        entry.status === 'failed' &&
        new Date(entry.timestamp) > cutoff
      ).length;

      if (recentFailures >= 2) {
        hotspots.push(testName);
      }
    }

    return hotspots;
  }

  /**
   * Get test performance trends
   */
  getTestTrends(testName: string, days: number = 7): {
    avgDuration: number;
    failureRate: number;
    retryRate: number;
    assertionErrorRate: number;
  } {
    const entries = this.getRecentEntries(testName, days);
    if (entries.length === 0) {
      return { avgDuration: 0, failureRate: 0, retryRate: 0, assertionErrorRate: 0 };
    }

    const avgDuration = entries.reduce((sum, entry) => sum + entry.duration, 0) / entries.length;
    const failureRate = (entries.filter(e => e.status === 'failed').length / entries.length) * 100;
    const retryRate = (entries.filter(e => e.retries > 0).length / entries.length) * 100;
    const assertionErrorRate = (entries.filter(e => e.assertionErrors > 0).length / entries.length) * 100;

    return { avgDuration, failureRate, retryRate, assertionErrorRate };
  }

  /**
   * Get shard performance analysis
   */
  getShardAnalysis(shard: string, days: number = 7): {
    totalTests: number;
    avgDuration: number;
    failureRate: number;
    retryRate: number;
    slowestTests: Array<{ testName: string; avgDuration: number }>;
  } {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const shardEntries: TestHistoryEntry[] = [];

    // Collect all entries for this shard
    for (const entries of Object.values(this.history)) {
      shardEntries.push(...entries.filter(entry =>
        entry.shard === shard &&
        new Date(entry.timestamp) > cutoff
      ));
    }

    if (shardEntries.length === 0) {
      return { totalTests: 0, avgDuration: 0, failureRate: 0, retryRate: 0, slowestTests: [] };
    }

    const totalTests = shardEntries.length;
    const avgDuration = shardEntries.reduce((sum, entry) => sum + entry.duration, 0) / totalTests;
    const failureRate = (shardEntries.filter(e => e.status === 'failed').length / totalTests) * 100;
    const retryRate = (shardEntries.filter(e => e.retries > 0).length / totalTests) * 100;

    // Calculate slowest tests
    const testDurations = new Map<string, number[]>();
    for (const entry of shardEntries) {
      const testName = this.getTestNameFromEntries(entry);
      if (!testDurations.has(testName)) {
        testDurations.set(testName, []);
      }
      testDurations.get(testName)!.push(entry.duration);
    }

    const slowestTests = Array.from(testDurations.entries())
      .map(([testName, durations]) => ({
        testName,
        avgDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length
      }))
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, 10);

    return { totalTests, avgDuration, failureRate, retryRate, slowestTests };
  }

  private getTestNameFromEntries(entry: TestHistoryEntry): string {
    // This is a simplified approach - in practice, you'd need to store test names
    // in the history entries or derive them from the data structure
    return 'unknown';
  }

  private getRecentEntries(testName: string, days: number): TestHistoryEntry[] {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return (this.history[testName] || []).filter(entry =>
      new Date(entry.timestamp) > cutoff
    );
  }

  private cleanupOldEntries(): void {
    const cutoff = new Date(Date.now() - this.maxHistoryDays * 24 * 60 * 60 * 1000);

    for (const testName of Object.keys(this.history)) {
      this.history[testName] = this.history[testName].filter(entry =>
        new Date(entry.timestamp) > cutoff
      );

      // Remove tests with no history
      if (this.history[testName].length === 0) {
        delete this.history[testName];
      }
    }
  }

  private loadHistory(): void {
    try {
      if (fs.existsSync(this.historyFile)) {
        const data = fs.readFileSync(this.historyFile, 'utf8');
        this.history = JSON.parse(data);
      }
    } catch (error) {
      console.warn('Failed to load test history:', error);
      this.history = {};
    }
  }

  private saveHistory(): void {
    try {
      fs.writeFileSync(this.historyFile, JSON.stringify(this.history, null, 2));
    } catch (error) {
      console.warn('Failed to save test history:', error);
    }
  }
}
