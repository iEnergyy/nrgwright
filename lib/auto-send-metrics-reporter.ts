import { Reporter, TestCase, TestResult, FullResult } from '@playwright/test/reporter';
import axios from 'axios';
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

class AutoSendMetricsReporter implements Reporter {
  private metrics: TestMetric[] = [];
  private metricsDir: string;
  private metricsFile: string;
  private sessionStartTime: number;
  private sessionId: string;
  private otlpUrl: string;
  private prometheusToken: string;

  constructor() {
    this.metricsDir = path.join(process.cwd(), 'metrics');
    this.metricsFile = path.join(this.metricsDir, `playwright-metrics-${new Date().toISOString().split('T')[0]}.json`);
    this.otlpUrl = 'https://otlp-gateway-prod-us-east-2.grafana.net/otlp/v1/metrics';
    this.prometheusToken = process.env.PROMETHEUS_TOKEN || '';

    // Create metrics directory if it doesn't exist
    if (!fs.existsSync(this.metricsDir)) {
      fs.mkdirSync(this.metricsDir, { recursive: true });
    }

    // Initialize session tracking
    this.sessionStartTime = Date.now();
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    if (!this.prometheusToken) {
      console.warn('⚠️  Prometheus token not configured. Metrics will not be sent automatically.');
    }
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

  async onEnd(result: FullResult) {
    console.log(`\n🎯 Test execution completed!`);
    console.log(`📊 Total tests recorded: ${this.metrics.length}`);

    // Save metrics to file
    this.saveMetricsToFile();

    // Save run session data
    this.saveRunSession();

    // Display summary
    this.displaySummary();

    // Auto-send metrics to Grafana
    if (this.prometheusToken) {
      console.log('\n🚀 Auto-sending metrics to Grafana Cloud...');
      await this.sendMetricsToGrafana();
    } else {
      console.log('\n📈 Metrics collected but not sent (no Prometheus token)');
      console.log('💡 Add PROMETHEUS_TOKEN to .env for auto-sending');
    }
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

  private async sendMetricsToGrafana() {
    try {
      // Convert to OTLP format
      const otlpMetrics = this.convertToOTLPFormat();

      // Add daily run metrics
      const dailyRunMetrics = await this.getDailyRunMetrics();
      if (dailyRunMetrics) {
        otlpMetrics.resourceMetrics[0].scopeMetrics[0].metrics.push(...dailyRunMetrics);
      }

      const response = await axios.post(
        this.otlpUrl,
        otlpMetrics,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${Buffer.from(`1328463:${this.prometheusToken}`).toString('base64')}`
          }
        }
      );

      console.log('✅ Metrics sent to Grafana Cloud OTLP endpoint successfully!');
      console.log(`📈 View in Grafana Cloud: https://ienergyy.grafana.net`);
    } catch (error) {
      console.error('❌ Failed to send metrics to Grafana Cloud:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
    }
  }

  private async getDailyRunMetrics() {
    const today = new Date().toISOString().split('T')[0];
    const sessionsFile = path.join(this.metricsDir, `run-sessions-${today}.json`);

    if (!fs.existsSync(sessionsFile)) {
      return null;
    }

    try {
      const sessionsData = JSON.parse(fs.readFileSync(sessionsFile, 'utf8'));
      const now = Date.now() * 1000000; // Convert to nanoseconds

      // Count total runs for today
      const dailyRunCount = sessionsData.length;

      // Calculate total tests run today
      const totalTestsToday = sessionsData.reduce((sum, session) => sum + session.total_tests, 0);

      // Calculate total duration today
      const totalDurationToday = sessionsData.reduce((sum, session) => sum + session.total_duration, 0);

      return [
        {
          name: 'playwright_daily_runs_total',
          unit: '1',
          description: 'Total number of test runs per day',
          gauge: {
            dataPoints: [{
              asInt: dailyRunCount,
              timeUnixNano: now,
              attributes: [
                { key: 'date', value: { stringValue: today } }
              ]
            }]
          }
        },
        {
          name: 'playwright_daily_tests_total',
          unit: '1',
          description: 'Total number of tests run per day',
          gauge: {
            dataPoints: [{
              asInt: totalTestsToday,
              timeUnixNano: now,
              attributes: [
                { key: 'date', value: { stringValue: today } }
              ]
            }]
          }
        },
        {
          name: 'playwright_daily_duration_seconds',
          unit: 's',
          description: 'Total test duration per day',
          gauge: {
            dataPoints: [{
              asDouble: totalDurationToday,
              timeUnixNano: now,
              attributes: [
                { key: 'date', value: { stringValue: today } }
              ]
            }]
          }
        }
      ];
    } catch (error) {
      console.error('❌ Failed to read daily run metrics:', error);
      return null;
    }
  }

  private convertToOTLPFormat() {
    const now = Date.now() * 1000000; // Convert to nanoseconds

    // Group metrics by type
    const testResults = this.metrics.reduce((acc, metric) => {
      const key = `${metric.project}_${metric.suite}_${metric.test_name}_${metric.status}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const testDurations = this.metrics.reduce((acc, metric) => {
      const key = `${metric.project}_${metric.suite}_${metric.test_name}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(metric.duration_seconds);
      return acc;
    }, {} as Record<string, number[]>);

    const metrics: Array<{
      name: string;
      unit: string;
      description: string;
      gauge?: {
        dataPoints: Array<{
          asInt?: number;
          asDouble?: number;
          timeUnixNano: number;
          attributes: Array<{
            key: string;
            value: {
              stringValue?: string;
              intValue?: number;
              doubleValue?: number;
            };
          }>;
        }>;
      };
    }> = [];

    // Add test results as gauge metrics
    Object.entries(testResults).forEach(([key, value]) => {
      const [project, suite, testName, status] = key.split('_');
      metrics.push({
        name: 'playwright_test_results_total',
        unit: '1',
        description: 'Total number of test results by status',
        gauge: {
          dataPoints: [{
            asInt: value,
            timeUnixNano: now,
            attributes: [
              { key: 'project', value: { stringValue: project } },
              { key: 'suite', value: { stringValue: suite } },
              { key: 'test_name', value: { stringValue: testName } },
              { key: 'status', value: { stringValue: status } }
            ]
          }]
        }
      });
    });

    // Add test durations as gauge metrics
    Object.entries(testDurations).forEach(([key, durations]) => {
      const [project, suite, testName] = key.split('_');
      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      metrics.push({
        name: 'playwright_test_duration_seconds',
        unit: 's',
        description: 'Average test duration in seconds',
        gauge: {
          dataPoints: [{
            asDouble: avgDuration,
            timeUnixNano: now,
            attributes: [
              { key: 'project', value: { stringValue: project } },
              { key: 'suite', value: { stringValue: suite } },
              { key: 'test_name', value: { stringValue: testName } }
            ]
          }]
        }
      });
    });

    return {
      resourceMetrics: [{
        scopeMetrics: [{
          metrics
        }]
      }]
    };
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

export default AutoSendMetricsReporter; 