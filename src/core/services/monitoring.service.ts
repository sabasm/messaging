import { injectable } from 'inversify';
import { IMonitoringService } from '../../interfaces/monitoring.interface';
import { MetricLabels } from '../types/metrics';

@injectable()
export class BaseMonitoringService implements IMonitoringService {
  private metricStore: Map<string, Map<string, number>> = new Map();

  increment(metric: string, labels?: MetricLabels): void {
    const key = this.getMetricKey(metric, labels);
    const currentValue = this.metricStore.get(key)?.get('count') || 0;
    this.setMetricValue(key, 'count', currentValue + 1);
  }

  gauge(metric: string, value: number, labels?: MetricLabels): void {
    const key = this.getMetricKey(metric, labels);
    this.setMetricValue(key, 'value', value);
  }

  histogram(metric: string, value: number, labels?: MetricLabels): void {
    const key = this.getMetricKey(metric, labels);
    this.setMetricValue(key, 'value', value);
  }

  getMetricValue(metric: string, labels?: MetricLabels): number {
    const key = this.getMetricKey(metric, labels);
    return this.metricStore.get(key)?.get('count') || 0;
  }

  private getMetricKey(metric: string, labels?: MetricLabels): string {
    if (!labels) return metric;
    const sortedLabels = Object.entries(labels)
      .filter(([, value]) => value !== undefined)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join(',');
    return sortedLabels ? `${metric}{${sortedLabels}}` : metric;
  }

  private setMetricValue(key: string, type: string, value: number): void {
    if (!this.metricStore.has(key)) {
      this.metricStore.set(key, new Map());
    }
    this.metricStore.get(key)?.set(type, value);
  }

  reset(): void {
    this.metricStore.clear();
  }
}


