
import { injectable, inject } from 'inversify';
import { MessagingService } from './MessagingService';
import { Message } from './types';
import { IMonitoringService } from './interfaces';
import { TYPES } from './constants';
import { HttpClient } from './core/types/http.types';

@injectable()
export class ApiMessagingService extends MessagingService {
  private isInitialized = false;
  private retryCount = 3;

  constructor(
    @inject(TYPES.MonitoringService) private monitoring: IMonitoringService,
    @inject(TYPES.HttpClient) private httpClient: HttpClient
  ) {
    super();
  }

  async init(): Promise<void> {
    if (!this.isInitialized) {
      this.monitoring.increment('api_provider_initialized', { state: 'init' });
      this.isInitialized = true;
    }
  }

  async dispose(): Promise<void> {
    if (this.isInitialized) {
      this.monitoring.increment('api_provider_disposed', { state: 'disposed' });
      this.isInitialized = false;
    }
  }

  async sendMessage(endpoint: string, message: Message): Promise<void> {
    if (!this.isInitialized) {
      await this.init();
    }
    await this.sendWithRetry(endpoint, message, false);
  }

  async sendBatch(endpoint: string, messages: Message[]): Promise<void> {
    if (!this.isInitialized) {
      await this.init();
    }
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
