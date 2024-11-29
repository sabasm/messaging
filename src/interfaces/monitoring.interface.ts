import { MetricLabels } from '../core/types/metrics';

export { MetricLabels };

export interface IMonitoringService {
 increment(metric: string, labels?: MetricLabels): void;
 gauge(metric: string, value: number, labels?: MetricLabels): void;
 histogram(metric: string, value: number, labels?: MetricLabels): void;
}


