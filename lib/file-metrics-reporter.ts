import { Reporter, TestCase, TestResult, FullResult } from '@playwright/test/reporter';
import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';

// Load environment variables
config({ path: './.env' });

interface TestMetric {
  test_name: string;
  project: string;
  suite: string;
  status: string;
  duration_seconds: number;
  retries: number;
  timestamp: number;
  date: string;
}

interface RunSession {
  session_id: string;
  start_time: number;
  end_time: number;
  total_tests: number;
  passed_tests: number;
  failed_tests: number;
  skipped_tests: number;
  total_duration: number;
  date: string;
}

class FileMetricsReporter implements Reporter {
  private metrics: TestMetric[] = [];
  private metricsDir: string;
  private metricsFile: string;
  private sessionStartTime: number;
  private sessionId: string;

  constructor() {
    this.metricsDir = path.join(process.cwd(), 'metrics');
    this.metricsFile = path.join(this.metricsDir, `playwright-metrics-${new Date().toISOString().split('T')[0]}.json`);

    // Create metrics directory if it doesn't exist
    if (!fs.existsSync(this.metricsDir)) {
      fs.mkdirSync(this.metricsDir, { recursive: true });
    }

    // Initialize session tracking
    this.sessionStartTime = Date.now();
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  onTestEnd(test: TestCase, result: TestResult) {
    const metric: TestMetric = {
      test_name: test.title,
      project: test.parent.project()?.name || 'unknown',
      suite: this.extractSuiteName(test.titlePath()),
      status: result.status,
      duration_seconds: result.duration / 1000,
      retries: result.retry || 0,
      timestamp: Date.now(),
      date: new Date().toISOString()
    };

    this.metrics.push(metric);
    console.log(`📊 Test: ${metric.test_name} (${metric.status}) - ${metric.duration_seconds.toFixed(2)}s`);
  }

  onEnd(result: FullResult) {
    console.log(`\n🎯 Test execution completed!`);
    console.log(`📊 Total tests recorded: ${this.metrics.length}`);

    // Save metrics to file
    this.saveMetricsToFile();

    // Save run session data
    this.saveRunSession();

    // Display summary
    this.displaySummary();
  }

  private saveMetricsToFile() {
    try {
      // Append to existing file or create new one
      let existingMetrics: TestMetric[] = [];
      if (fs.existsSync(this.metricsFile)) {
        const fileContent = fs.readFileSync(this.metricsFile, 'utf8');
        existingMetrics = JSON.parse(fileContent);
      }

      // Combine existing and new metrics
      const allMetrics = [...existingMetrics, ...this.metrics];

      // Save to file
      fs.writeFileSync(this.metricsFile, JSON.stringify(allMetrics, null, 2));

      console.log(`💾 Metrics saved to: ${this.metricsFile}`);
    } catch (error) {
      console.error('❌ Failed to save metrics:', error);
    }
  }

  private saveRunSession() {
    try {
      const sessionData: RunSession = {
        session_id: this.sessionId,
        start_time: this.sessionStartTime,
        end_time: Date.now(),
        total_tests: this.metrics.length,
        passed_tests: this.metrics.filter(m => m.status === 'passed').length,
        failed_tests: this.metrics.filter(m => m.status === 'failed').length,
        skipped_tests: this.metrics.filter(m => m.status === 'skipped').length,
        total_duration: this.metrics.reduce((sum, m) => sum + m.duration_seconds, 0),
        date: new Date().toISOString().split('T')[0]
      };

      const sessionsFile = path.join(this.metricsDir, `run-sessions-${new Date().toISOString().split('T')[0]}.json`);

      // Load existing sessions or create new array
      let existingSessions: RunSession[] = [];
      if (fs.existsSync(sessionsFile)) {
        const fileContent = fs.readFileSync(sessionsFile, 'utf8');
        existingSessions = JSON.parse(fileContent);
      }

      // Add new session
      existingSessions.push(sessionData);

      // Save to file
      fs.writeFileSync(sessionsFile, JSON.stringify(existingSessions, null, 2));

      console.log(`💾 Run session saved to: ${sessionsFile}`);
    } catch (error) {
      console.error('❌ Failed to save run session:', error);
    }
  }

  private displaySummary() {
    const summary = {
      total_tests: this.metrics.length,
      passed: this.metrics.filter(m => m.status === 'passed').length,
      failed: this.metrics.filter(m => m.status === 'failed').length,
      skipped: this.metrics.filter(m => m.status === 'skipped').length,
      total_duration: this.metrics.reduce((sum, m) => sum + m.duration_seconds, 0),
      avg_duration: this.metrics.reduce((sum, m) => sum + m.duration_seconds, 0) / this.metrics.length,
      by_project: this.metrics.reduce((acc, m) => {
        acc[m.project] = (acc[m.project] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      by_suite: this.metrics.reduce((acc, m) => {
        acc[m.suite] = (acc[m.suite] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };

    console.log('\n📈 Test Execution Summary:');
    console.log(`   Total Tests: ${summary.total_tests}`);
    console.log(`   Passed: ${summary.passed}`);
    console.log(`   Failed: ${summary.failed}`);
    console.log(`   Skipped: ${summary.skipped}`);
    console.log(`   Total Duration: ${summary.total_duration.toFixed(2)}s`);
    console.log(`   Average Duration: ${summary.avg_duration.toFixed(2)}s`);

    console.log('\n📊 By Project:');
    Object.entries(summary.by_project).forEach(([project, count]) => {
      console.log(`   ${project}: ${count} tests`);
    });

    console.log('\n📊 By Suite:');
    Object.entries(summary.by_suite).forEach(([suite, count]) => {
      console.log(`   ${suite}: ${count} tests`);
    });
  }

  private extractSuiteName(titlePath: string[]): string {
    if (titlePath.length >= 2) {
      return titlePath[1];
    }
    return 'unknown';
  }
}

export default FileMetricsReporter; 