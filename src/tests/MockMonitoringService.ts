import { injectable } from 'inversify';
import { IMonitoringService, MetricLabels } from '../interfaces/monitoring.interface';

@injectable()
export class MockMonitoringService implements IMonitoringService {
  private metrics: Map<string, number> = new Map();

  increment(metric: string, labels?: Partial<MetricLabels>): void {
    const key = labels ? `${metric}:${JSON.stringify(labels)}` : metric;
    this.metrics.set(key, (this.metrics.get(key) || 0) + 1);
  }

  gauge(metric: string, value: number, labels?: Partial<MetricLabels>): void {
    const key = labels ? `${metric}:${JSON.stringify(labels)}` : metric;
    this.metrics.set(key, value);
  }

  histogram(metric: string, value: number, labels?: Partial<MetricLabels>): void {
    const key = labels ? `${metric}:${JSON.stringify(labels)}` : metric;
    this.metrics.set(key, value);
  }

  getMetricCount(metric: string, labels?: Partial<MetricLabels>): number {
    const key = labels ? `${metric}:${JSON.stringify(labels)}` : metric;
    return this.metrics.get(key) || 0;
  }

  reset(): void {
    this.metrics.clear();
  }
}


