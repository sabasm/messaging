import { injectable } from 'inversify';
import { IMonitoringService } from './interfaces';

@injectable()
export class MonitoringService implements IMonitoringService {
  increment(_metric: string, _labels?: Record<string, string>): void {
    console.log('metric = ', _metric, ' labels = ', _labels)
  }
}


