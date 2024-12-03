import { injectable, inject } from 'inversify';
import { BaseMiddleware } from '../base.middleware';
import { Context } from '../types';
import { TYPES } from '../../constants';
import { IMonitoringService } from '../../interfaces';

@injectable()
export class LoggingMiddleware extends BaseMiddleware {
  priority = 200;

  constructor(@inject(TYPES.MonitoringService) private monitoring: IMonitoringService) {
    super();
  }

  async execute(context: Context): Promise<void> {
    const startTime = Date.now();
    
    try {
      this.monitoring.increment('message_processing_started', {
        destination: context.destination
      });
      
      context.metadata.processingStart = startTime;
      
      this.monitoring.histogram('message_size', JSON.stringify(context.message).length, {
        destination: context.destination
      });
    } catch (error) {
      this.monitoring.increment('message_processing_error', {
        destination: context.destination,
        error: error instanceof Error ? error.message : 'unknown'
      });
      throw error;
    }
  }
}


