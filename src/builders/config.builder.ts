import { MessagingConfig, configSchema } from '../core/types/config.types';

export class MessagingConfigBuilder {
  private config: MessagingConfig = {
    messaging: {
      api: {
        baseUrl: 'http://localhost:3000',
        timeout: 5000,
        retryCount: 3,
        retryDelay: 1000,
        healthCheck: {
          enabled: true,
          interval: 30000
        }
      },
      rabbitmq: {
        url: 'amqp://localhost',
        retryCount: 3,
        prefetch: 1,
        queues: {}
      },
      monitoring: {
        enabled: true,
        metricsPrefix: 'messaging',
        flushInterval: 10000
      }
    }
  };

  withApiMessaging(config: {
    baseUrl: string;
    timeout?: number;
    retryCount?: number;
    retryDelay?: number;
    healthCheck?: {
      enabled?: boolean;
      interval?: number;
    };
  }): this {
    this.config.messaging.api = {
      baseUrl: config.baseUrl,
      timeout: config.timeout ?? this.config.messaging.api.timeout,
      retryCount: config.retryCount ?? this.config.messaging.api.retryCount,
      retryDelay: config.retryDelay ?? this.config.messaging.api.retryDelay,
      healthCheck: {
        enabled: config.healthCheck?.enabled ?? this.config.messaging.api.healthCheck.enabled,
        interval: config.healthCheck?.interval ?? this.config.messaging.api.healthCheck.interval
      }
    };
    return this;
  }

  withRabbitMQ(config: {
    url: string;
    retryCount?: number;
    prefetch?: number;
    queues?: Record<string, string>;
  }): this {
    this.config.messaging.rabbitmq = {
      url: config.url,
      retryCount: config.retryCount ?? this.config.messaging.rabbitmq.retryCount,
      prefetch: config.prefetch ?? this.config.messaging.rabbitmq.prefetch,
      queues: config.queues ?? this.config.messaging.rabbitmq.queues
    };
    return this;
  }

  withFallback(strategy: 'api' | 'rabbitmq'): this {
    this.config.messaging.fallback = {
      enabled: true,
      strategy
    };
    return this;
  }

  build(): MessagingConfig {
    const result = configSchema.safeParse(this.config);
    if (!result.success) {
      throw new Error(`Invalid configuration: ${result.error.message}`);
    }
    return result.data;
  }
}
