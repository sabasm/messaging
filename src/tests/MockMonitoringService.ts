import { IMonitoringService } from '../interfaces';

export class MockMonitoringService implements IMonitoringService {
  private metrics: Map<string, number> = new Map();

  increment(metric: string, labels?: Record<string, string>): void {
    const key = labels ? `${metric}:${JSON.stringify(labels)}` : metric;
    this.metrics.set(key, (this.metrics.get(key) || 0) + 1);
  }

  getMetricCount(metric: string, labels?: Record<string, string>): number {
    const key = labels ? `${metric}:${JSON.stringify(labels)}` : metric;
    return this.metrics.get(key) || 0;
  }

  reset(): void {
    this.metrics.clear();
  }
}


