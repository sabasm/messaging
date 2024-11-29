import { injectable, inject } from 'inversify';
import { IMessagingService } from '../interfaces';
import { Message } from '../types';
import { BaseConfig } from '../config/base.config';
import { TYPES } from '../constants';
import { HttpClient } from '../core/types/http.types';
import { BaseService } from '../core/services/base.service';
import { IMonitoringService } from '../interfaces';

@injectable()
export class ApiMessagingProvider extends BaseService implements IMessagingService {
  private isInitialized = false;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor(
    @inject(TYPES.Config) private globalConfig: BaseConfig,
    @inject(TYPES.MonitoringService) private monitoring: IMonitoringService,
    @inject(TYPES.HttpClient) private httpClient: HttpClient
  ) {
    super(globalConfig.getConfig());
  }

  private handleError(error: unknown, isFinal: boolean): void {
    this.monitoring.increment('message_failed', {
      error: error instanceof Error ? error.message : 'unknown'
    });
    if (isFinal) {
      throw error;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async performHealthCheck(): Promise<void> {
    try {
      const apiConfig = this.globalConfig.getConfig().messaging.api;
      const healthEndpoint = `${apiConfig.baseUrl}/health`;
      await this.httpClient.post(healthEndpoint, { timestamp: new Date() });
      this.monitoring.gauge('api_provider_health', 1);
    } catch (err) {
      this.monitoring.gauge('api_provider_health', 0);
      this.monitoring.increment('api_provider_health_check_failed');
    }
  }

  async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const apiConfig = this.globalConfig.getConfig().messaging.api;
      if (!apiConfig.baseUrl) {
        throw new Error('API baseUrl is required');
      }

      if (apiConfig.healthCheck.enabled) {
        this.healthCheckInterval = setInterval(
          () => this.performHealthCheck(),
          apiConfig.healthCheck.interval
        );
      }

      this.monitoring.gauge('api_provider_initialized', 1);
      this.monitoring.gauge('api_provider_health', 1);
      this.isInitialized = true;

    } catch (err) {
      const error = err as Error;
      this.monitoring.gauge('api_provider_initialized', 0);
      throw new Error(`Failed to initialize ApiMessagingProvider: ${error.message}`);
    }
  }

  async sendMessage(destination: string, message: Message): Promise<void> {
    if (!this.isInitialized) {
      await this.init();
    }
    await this.sendWithRetry(destination, message);
  }

  async sendBatch(destination: string, messages: Message[]): Promise<void> {
    if (!this.isInitialized) {
      await this.init();
    }
    await Promise.all(messages.map(msg => this.sendWithRetry(destination, msg)));
  }

  private async sendWithRetry(destination: string, message: Message): Promise<void> {
    const config = this.globalConfig.getConfig().messaging.api;

    for (let attempt = 1; attempt <= config.retryCount; attempt++) {
      try {
        await this.httpClient.post(destination, message);
        this.monitoring.increment('message_sent', { destination });
        return;
      } catch (error) {
        this.handleError(error, attempt === config.retryCount);
        await this.delay(config.retryDelay * attempt);
      }
    }
  }

  async dispose(): Promise<void> {
    try {
      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval);
        this.healthCheckInterval = null;
      }

      this.monitoring.gauge('api_provider_health', 0);
      this.monitoring.gauge('api_provider_initialized', 0);
      this.isInitialized = false;

    } catch (err) {
      const error = err as Error;
      this.monitoring.increment('api_provider_dispose_error');
      throw new Error(`Failed to dispose ApiMessagingProvider: ${error.message}`);
    }
  }
}

