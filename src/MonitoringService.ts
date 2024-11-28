import { injectable } from 'inversify';
import { IMonitoringService, MetricLabels } from './interfaces/monitoring.interface';

@injectable()
export class MonitoringService implements IMonitoringService {
  increment(metric: string, labels?: Partial<MetricLabels>): void {
    console.log(`metric = ${metric}, labels =`, labels);
  }

  gauge(metric: string, value: number, labels?: Partial<MetricLabels>): void {
    console.log(`gauge = ${metric}, value = ${value}, labels =`, labels);
  }

  histogram(metric: string, value: number, labels?: Partial<MetricLabels>): void {
    console.log(`histogram = ${metric}, value = ${value}, labels =`, labels);
  }
}


