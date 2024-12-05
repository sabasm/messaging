import { configSchema, MessagingConfig } from '../core/types/config.types';
import { DEFAULT_CONFIG } from './messaging.config';

export class BaseConfig {
  private static instance: BaseConfig | null = null;
  private readonly config: MessagingConfig;

  private constructor() {
    const config = {
      api: {
        baseUrl: process.env.API_BASE_URL || DEFAULT_CONFIG.api.baseUrl,
        timeout: Number(process.env.API_TIMEOUT) || DEFAULT_CONFIG.api.timeout,
        retryCount: Number(process.env.API_RETRY_COUNT) || DEFAULT_CONFIG.api.retryCount,
        retryDelay: Number(process.env.API_RETRY_DELAY) || DEFAULT_CONFIG.api.retryDelay,
        healthCheck: {
          enabled: process.env.API_HEALTH_CHECK_ENABLED !== 'false',
          interval: Number(process.env.API_HEALTH_CHECK_INTERVAL) || DEFAULT_CONFIG.api.healthCheck.interval
        }
      },
      rabbitmq: {
        url: process.env.RABBIT_URL || DEFAULT_CONFIG.rabbitmq.url,
        retryCount: Number(process.env.RABBIT_RETRY_COUNT) || DEFAULT_CONFIG.rabbitmq.retryCount,
        retryDelay: Number(process.env.RABBIT_RETRY_DELAY) || DEFAULT_CONFIG.rabbitmq.retryDelay,
        queueOptions: DEFAULT_CONFIG.rabbitmq.queueOptions,
        prefetchCount: Number(process.env.RABBIT_PREFETCH) || DEFAULT_CONFIG.rabbitmq.prefetchCount,
        heartbeatInterval: Number(process.env.RABBIT_HEARTBEAT_INTERVAL) || DEFAULT_CONFIG.rabbitmq.heartbeatInterval,
        reconnectDelay: Number(process.env.RABBIT_RECONNECT_DELAY) || DEFAULT_CONFIG.rabbitmq.reconnectDelay
      },
      monitoring: {
        enabled: process.env.MONITORING_ENABLED !== 'false',
        metricsPrefix: process.env.METRICS_PREFIX || DEFAULT_CONFIG.monitoring.metricsPrefix,
        flushInterval: Number(process.env.METRICS_FLUSH_INTERVAL) || DEFAULT_CONFIG.monitoring.flushInterval
      }
    };

    const result = configSchema.safeParse(config);
    if (!result.success) {
      throw new Error(`Invalid configuration: ${result.error.message}`);
    }

    this.config = result.data;
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


