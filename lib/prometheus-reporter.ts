// prometheus-reporter.ts

import { Reporter, TestCase, TestResult, FullResult } from '@playwright/test/reporter';
import * as client from 'prom-client';
import * as fs from 'fs';
import * as path from 'path';

class PrometheusReporter implements Reporter {
  private registry: client.Registry;
  private durationHistogram: client.Histogram;
  private retryCounter: client.Counter;
  private dailyRunsCounter: client.Counter;
  private gateway: any = null;
  private runDate: string;
  private projectName: string = 'default';

  constructor() {
    this.registry = new client.Registry();

    // Get current date for daily runs tracking
    this.runDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    this.durationHistogram = new client.Histogram({
      name: 'playwright_test_duration_seconds',
      help: 'Test duration in seconds',
      labelNames: ['test', 'project', 'status'],
      buckets: [0.1, 0.5, 1, 2, 5, 10],
    });

    this.retryCounter = new client.Counter({
      name: 'playwright_test_retry_total',
      help: 'Number of times a test was retried',
      labelNames: ['test', 'project'],
    });

    this.dailyRunsCounter = new client.Counter({
      name: 'playwright_daily_runs_total',
      help: 'Number of test runs per day',
      labelNames: ['date', 'project'],
    });

    this.registry.registerMetric(this.durationHistogram);
    this.registry.registerMetric(this.retryCounter);
    this.registry.registerMetric(this.dailyRunsCounter);
    client.collectDefaultMetrics({ register: this.registry });
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    try {
      const durationSeconds = result.duration / 1000;

      // Get project name from test metadata
      let projectName = 'default';
      try {
        projectName = test.parent.project().name;
        // Store the project name for daily runs counter
        this.projectName = projectName;
      } catch (error) {
        console.warn('⚠️ Could not get project name from metadata');
      }
      console.log(`📊 Recording metrics for test "${test.title}" in project "${projectName}"`);

      const labels = {
        test: test.title || 'unknown',
        project: projectName,
        status: result.status || 'unknown',
      };

      this.durationHistogram.observe(labels, durationSeconds);
      if (result.retry > 0) {
        this.retryCounter.inc({ test: test.title, project: projectName });
      }
    } catch (error) {
      console.error('❌ Error recording test metrics:', error);
    }
  }

  async onEnd(result: FullResult): Promise<void> {
    try {
      // Increment daily runs counter for this test run
      try {
        this.dailyRunsCounter.inc({
          date: this.runDate,
          project: this.projectName
        });

        console.log(`📅 Incremented daily runs counter for ${this.runDate} in project ${this.projectName}`);
      } catch (error) {
        console.warn('⚠️ Could not increment daily runs counter:', error);
      }

      // 📊 Print human-readable Prometheus metrics output
      const metricsText = await this.registry.metrics();
      console.log('📊 Prometheus Metrics Preview:\n', metricsText);

      // 📋 Optional: also show as structured JSON
      const metricsJSON = await this.registry.getMetricsAsJSON();
      console.log('📋 Parsed Metrics JSON:\n', JSON.stringify(metricsJSON, null, 2));

      // 💾 Save metrics JSON to file for review
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const metricsDir = path.join(process.cwd(), 'metrics');

      // Create metrics directory if it doesn't exist
      if (!fs.existsSync(metricsDir)) {
        fs.mkdirSync(metricsDir, { recursive: true });
      }

      const metricsFilePath = path.join(metricsDir, `metrics-${timestamp}.json`);
      fs.writeFileSync(metricsFilePath, JSON.stringify(metricsJSON, null, 2));
      console.log(`💾 Metrics saved to: ${metricsFilePath}`);

      // Only push if not explicitly disabled (for debugging)
      // if (process.env.METRICS_PUSH !== 'false') {
      //   const gatewayUrl = process.env.PUSHGATEWAY_URL || 'http://localhost:9091';
      //   this.gateway = new client.Pushgateway(gatewayUrl);

      //   try {
      //     await this.gateway.pushAdd({
      //       jobName: 'playwright-tests',
      //       registry: this.registry,
      //     });

      //     console.log('✅ Metrics successfully pushed to PushGateway');
      //   } catch (err) {
      //     console.error('❌ Error pushing metrics to PushGateway:', err);
      //   } finally {
      //     // Clean up the gateway connection
      //     if (this.gateway) {
      //       try {
      //         await this.gateway.delete();
      //       } catch (cleanupError) {
      //         console.warn('⚠️ Warning: Could not clean up Pushgateway connection:', cleanupError);
      //       }
      //       this.gateway = null;
      //     }
      //   }
      // } else {
      //   console.log('⚠️ METRICS_PUSH is false, skipping PushGateway upload');
      // }
    } catch (error) {
      console.error('❌ Error in onEnd:', error);
    } finally {
      // Reset metrics after processing
      try {
        this.registry.resetMetrics();
      } catch (resetError) {
        console.warn('⚠️ Warning: Could not reset metrics:', resetError);
      }
    }
  }
}

export default PrometheusReporter;
