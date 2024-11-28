import { MetricLabels } from '../types/metrics';

export interface MetricsService {
 increment(metric: string, labels?: MetricLabels): void;
 gauge(metric: string, value: number, labels?: MetricLabels): void;
 histogram(metric: string, value: number, labels?: MetricLabels): void;
}

export class NoopMetricsService implements MetricsService {
 increment(): void {}
 gauge(): void {}
 histogram(): void {}
}


