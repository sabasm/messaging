import { injectable, inject } from 'inversify';
import { BaseMessagingService } from '../base/BaseMessagingService';
import { Message } from '../../types';
import { IMonitoringService } from '../../interfaces';
import { TYPES } from '../../constants';
import { HttpClient } from '../../core/types/http.types';

@injectable()
export class ApiMessagingService extends BaseMessagingService {
  private isInitialized = false;
  private retryCount = 3;

  constructor(
    @inject(TYPES.MonitoringService) monitoring: IMonitoringService,
    @inject(TYPES.HttpClient) private httpClient: HttpClient
  ) {
    super(monitoring);
  }

  protected getServiceName(): string {
    return 'api';
  }

  async sendMessage(endpoint: string, message: Message): Promise<void> {
    await this.initialize();
    await this.sendWithRetry(endpoint, message, false);
  }

  async sendBatch(endpoint: string, messages: Message[]): Promise<void> {
    await this.initialize();
    if (messages.length > 0) {
      await this.sendWithRetry(endpoint, messages, true);
    }
  }

  private async sendWithRetry(endpoint: string, payload: Message | Message[], isBatch: boolean): Promise<void> {
    const labels = { destination: endpoint, batch: String(isBatch) };

    for (let attempt = 1; attempt <= this.retryCount; attempt++) {
      try {
        const data = isBatch ? payload : this.preprocessMessage(payload as Message);
        await this.httpClient.post(endpoint, data);
        this.monitoring.increment('messages_sent', labels);
        return;
      } catch (error) {
        this.monitoring.increment('messages_failed', labels);
        if (attempt === this.retryCount) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, attempt * 1000));
      }
    }
  }
}


