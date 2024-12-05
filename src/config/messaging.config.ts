export interface MonitoringConfig {
  enabled: boolean;
  metricsPrefix: string;
  flushInterval: number;
}

export interface HealthCheckConfig {
  enabled: boolean;
  interval: number;
}

export interface RabbitMQConfig {
  url: string;
  retryCount: number;
  retryDelay: number;
  queueOptions: {
    durable: boolean;
    maxPriority: number;
    deadLetterExchange?: string;
    messageTtl?: number;
  };
  prefetchCount: number;
  heartbeatInterval: number;
  reconnectDelay: number;
}

export interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retryCount: number;
  retryDelay: number;
  healthCheck: HealthCheckConfig;
}

export interface MessagingConfig {
  rabbitmq: RabbitMQConfig;
  api: ApiConfig;
  monitoring: MonitoringConfig;
  fallback?: {
    enabled: boolean;
    strategy: 'api' | 'rabbitmq';
  };
}

export const DEFAULT_CONFIG: MessagingConfig = {
  rabbitmq: {
    url: 'amqp://localhost',
    retryCount: 3,
    retryDelay: 1000,
    queueOptions: {
      durable: true,
      maxPriority: 10,
      deadLetterExchange: 'dlx',
      messageTtl: 86400000, // 24 hours
    },
    prefetchCount: 1,
    heartbeatInterval: 30000,
    reconnectDelay: 5000,
  },
  api: {
    baseUrl: 'http://localhost:3000',
    timeout: 5000,
    retryCount: 3,
    retryDelay: 1000,
    healthCheck: {
      enabled: true,
      interval: 30000,
    },
  },
  monitoring: {
    enabled: true,
    metricsPrefix: 'messaging',
    flushInterval: 10000,
  },
  fallback: {
    enabled: true,
    strategy: 'rabbitmq',
  },
};
