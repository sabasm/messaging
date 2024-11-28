import { injectable } from 'inversify';
import { IMonitoringService, MetricLabels } from './interfaces/monitoring.interface';

@injectable()
export class MockMonitoringService implements IMonitoringService {
  private metrics: Record<string, number> = {};
  private labels: Record<string, Record<string, string>> = {};

  increment(metric: string, labels?: Partial<MetricLabels>): void {
    const labelKey = this.getLabelKey(labels);
    const key = `${metric}:${labelKey}`;
    this.metrics[key] = (this.metrics[key] || 0) + 1;
  }

  gauge(metric: string, value: number, labels?: Partial<MetricLabels>): void {
    const labelKey = this.getLabelKey(labels);
    const key = `${metric}:${labelKey}`;
    this.metrics[key] = value;
  }

  histogram(metric: string, value: number, labels?: Partial<MetricLabels>): void {
    const labelKey = this.getLabelKey(labels);
    const key = `${metric}:${labelKey}`;
    this.metrics[key] = value;
  }

  getMetricCount(metric: string, labels?: Partial<MetricLabels>): number {
    const labelKey = this.getLabelKey(labels);
    const key = `${metric}:${labelKey}`;
    return this.metrics[key] || 0;
  }

  reset(): void {
    this.metrics = {};
    this.labels = {};
  }

  private getLabelKey(labels?: Partial<MetricLabels>): string {
    return labels ? JSON.stringify(labels) : 'default';
  }
}


