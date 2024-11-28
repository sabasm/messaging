import { injectable, inject } from 'inversify';
import axios from 'axios';
import { MessagingService } from './MessagingService';
import { Message } from './types';
import { IMonitoringService } from './interfaces';
import { TYPES } from './constants';

@injectable()
export class ApiMessagingService extends MessagingService {
  private retryCount = 3;

  constructor(
    @inject(TYPES.MonitoringService) private monitoring: IMonitoringService
  ) {
    super();
  }

  async sendMessage(endpoint: string, message: Message): Promise<void> {
    const processedMessage = this.preprocessMessage(message);

    for (let attempt = 1; attempt <= this.retryCount; attempt++) {
      try {
        await axios.post(endpoint, processedMessage, {
          headers: { 'Content-Type': 'application/json' }
        });
        this.monitoring.increment('messages_sent', { destination: endpoint });
        return;
      } catch (error) {
        this.monitoring.increment('messages_failed', { destination: endpoint });
        if (attempt === this.retryCount) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, attempt * 1000));
      }
    }
  }

  async sendBatch(endpoint: string, messages: Message[]): Promise<void> {
    const processedMessages = messages.map(msg => this.preprocessMessage(msg));

    for (let attempt = 1; attempt <= this.retryCount; attempt++) {
      try {
        await axios.post(endpoint, processedMessages, {
          headers: { 'Content-Type': 'application/json' }
        });
        this.monitoring.increment('messages_sent', { destination: endpoint, batch: 'true' });
        return;
      } catch (error) {
        this.monitoring.increment('messages_failed', { destination: endpoint, batch: 'true' });
        if (attempt === this.retryCount) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, attempt * 1000));
      }
    }
  }
}


