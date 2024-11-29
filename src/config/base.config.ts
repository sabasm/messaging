import { configSchema, MessagingConfig } from '../core/types/config.types';

export class BaseConfig {
  private static instance: BaseConfig | null = null;
  private readonly config: MessagingConfig;

  private constructor() {
    const config = {
      messaging: {
        api: {
          baseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
          timeout: Number(process.env.API_TIMEOUT) || 5000,
          retryCount: Number(process.env.API_RETRY_COUNT) || 3,
          retryDelay: Number(process.env.API_RETRY_DELAY) || 1000,
          healthCheck: {
            enabled: process.env.API_HEALTH_CHECK_ENABLED !== 'false',
            interval: Number(process.env.API_HEALTH_CHECK_INTERVAL) || 30000
          }
        },
        rabbitmq: {
          url: process.env.RABBIT_URL || 'amqp://localhost',
          retryCount: Number(process.env.RABBIT_RETRY_COUNT) || 3,
          prefetch: Number(process.env.RABBIT_PREFETCH) || 1,
          queues: {}
        },
        monitoring: {
          enabled: process.env.MONITORING_ENABLED !== 'false',
          metricsPrefix: process.env.METRICS_PREFIX || 'messaging',
          flushInterval: Number(process.env.METRICS_FLUSH_INTERVAL) || 10000
        }
      }
    };

    const result = configSchema.safeParse(config);
    if (!result.success) {
      throw new Error(`Config validation failed: ${result.error.message}`);
    }

    this.config = result.data;
    Object.freeze(this.config);
  }

  public static getInstance(): BaseConfig {
    if (!this.instance) {
      this.instance = new BaseConfig();
    }
    return this.instance;
  }

  public static clearInstance(): void {
    this.instance = null;
  }

  public getConfig(): MessagingConfig {
    return this.config;
  }
}


