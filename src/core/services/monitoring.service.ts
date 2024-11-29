import { injectable } from 'inversify';
import { IMonitoringService } from '../../interfaces/monitoring.interface';
import { MetricLabels } from '../types/metrics';

@injectable()
export class MonitoringService implements IMonitoringService {
 increment(metric: string, labels?: MetricLabels): void {
   console.log(`metric = ${metric}, labels =`, labels);
 }

 gauge(metric: string, value: number, labels?: MetricLabels): void {
   console.log(`gauge = ${metric}, value = ${value}, labels =`, labels);
 }

 histogram(metric: string, value: number, labels?: MetricLabels): void {
   console.log(`histogram = ${metric}, value = ${value}, labels =`, labels);
 }
}


