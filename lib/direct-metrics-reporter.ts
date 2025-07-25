import { Reporter, TestCase, TestResult, FullResult } from '@playwright/test/reporter';
import axios from 'axios';
import { config } from 'dotenv';

// Load environment variables
config({ path: './config.env' });

interface TestMetric {
  test_name: string;
  project: string;
  suite: string;
  status: string;
  duration_seconds: number;
  retries: number;
  timestamp: number;
}

class DirectMetricsReporter implements Reporter {
  private grafanaUrl: string;
  private apiKey: string;
  private metrics: TestMetric[] = [];

  constructor() {
    this.grafanaUrl = process.env.GRAFANA_CLOUD_URL || '';
    this.apiKey = process.env.GRAFANA_CLOUD_API_KEY || '';

    if (!this.grafanaUrl || !this.apiKey) {
      console.warn('⚠️  Grafana Cloud credentials not configured. Metrics will not be sent.');
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
      timestamp: Date.now()
    };

    this.metrics.push(metric);
    console.log(`📊 Test: ${metric.test_name} (${metric.status}) - ${metric.duration_seconds.toFixed(2)}s`);
  }

  async onEnd(result: FullResult) {
    console.log(`\n🎯 Test execution completed!`);
    console.log(`📊 Total tests recorded: ${this.metrics.length}`);

    if (this.grafanaUrl && this.apiKey) {
      await this.sendMetricsToGrafana();
    } else {
      console.log('📈 Metrics collected but not sent (no Grafana credentials)');
      console.log('💡 Add GRAFANA_CLOUD_URL and GRAFANA_CLOUD_API_KEY to config.env');
    }
  }

  private async sendMetricsToGrafana() {
    try {
      // Send metrics as Prometheus remote write format
      const prometheusMetrics = this.convertToPrometheusFormat();

      const response = await axios.post(
        `${this.grafanaUrl}/api/prom/push`,
        prometheusMetrics,
        {
          headers: {
            'Content-Type': 'text/plain',
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      console.log('✅ Metrics sent to Grafana Cloud successfully!');
      console.log(`📈 View in Grafana Cloud: ${this.grafanaUrl}`);
    } catch (error) {
      console.error('❌ Failed to send metrics to Grafana Cloud:', error.message);
    }
  }

  private convertToPrometheusFormat(): string {
    let prometheusData = '';

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

    // Convert to Prometheus format
    Object.entries(testResults).forEach(([key, value]) => {
      const [project, suite, testName, status] = key.split('_');
      prometheusData += `playwright_test_results_total{project="${project}",suite="${suite}",test_name="${testName}",status="${status}"} ${value}\n`;
    });

    Object.entries(testDurations).forEach(([key, durations]) => {
      const [project, suite, testName] = key.split('_');
      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      prometheusData += `playwright_test_duration_seconds{project="${project}",suite="${suite}",test_name="${testName}"} ${avgDuration}\n`;
    });

    return prometheusData;
  }

  private extractSuiteName(titlePath: string[]): string {
    if (titlePath.length >= 2) {
      return titlePath[1];
    }
    return 'unknown';
  }
}

export default DirectMetricsReporter; 