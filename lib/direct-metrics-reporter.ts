import { Reporter, TestCase, TestResult, FullResult } from '@playwright/test/reporter';
import axios from 'axios';
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
}

interface OTLPMetric {
  resourceMetrics: Array<{
    scopeMetrics: Array<{
      metrics: Array<{
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
        sum?: {
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
      }>;
    }>;
  }>;
}

class DirectMetricsReporter implements Reporter {
  private otlpUrl: string;
  private prometheusToken: string;
  private metrics: TestMetric[] = [];

  constructor() {
    this.otlpUrl = 'https://otlp-gateway-prod-us-east-2.grafana.net/otlp/v1/metrics';
    this.prometheusToken = process.env.PROMETHEUS_TOKEN || '';

    if (!this.prometheusToken) {
      console.warn('⚠️  Prometheus token not configured. Metrics will not be sent.');
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

    if (this.prometheusToken) {
      await this.sendMetricsToGrafana();
    } else {
      console.log('📈 Metrics collected but not sent (no Prometheus token)');
      console.log('💡 Add PROMETHEUS_TOKEN to .env');
    }
  }

  private async sendMetricsToGrafana() {
    try {
      // Convert to OTLP format
      const otlpMetrics = this.convertToOTLPFormat();

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

  private convertToOTLPFormat(): OTLPMetric {
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
      sum?: {
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

  private extractSuiteName(titlePath: string[]): string {
    if (titlePath.length >= 2) {
      return titlePath[1];
    }
    return 'unknown';
  }
}

export default DirectMetricsReporter; 