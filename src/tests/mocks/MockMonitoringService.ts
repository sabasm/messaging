import { IMonitoringService } from '../../interfaces/monitoring.interface';
import { MetricLabels } from '../../core/types/metrics';

export class MockMonitoringService implements IMonitoringService {
  private metrics = new Map<string, number>();

  increment(metric: string, labels?: MetricLabels): void {
    const key = this.buildMetricKey(metric, labels);
    this.metrics.set(key, (this.metrics.get(key) || 0) + 1);
  }

  gauge(metric: string, value: number, labels?: MetricLabels): void {
    const key = this.buildMetricKey(metric, labels);
    this.metrics.set(key, value);
  }

  histogram(metric: string, value: number, labels?: MetricLabels): void {
    const key = this.buildMetricKey(metric, labels);
    this.metrics.set(key, value);
  }

  getMetricCount(metric: string, labels?: MetricLabels): number {
    const key = this.buildMetricKey(metric, labels);
    return this.metrics.get(key) || 0;
  }

  reset(): void {
    this.metrics.clear();
  }

  private buildMetricKey(metric: string, labels?: MetricLabels): string {
    if (!labels) return metric;
    const sortedLabels = Object.entries(labels)
      .filter(([, value]) => value !== undefined)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join(',');
    return `${metric}{${sortedLabels}}`;
  }
}


