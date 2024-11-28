export interface MessagingConfig {
  rabbit: {
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
  };
  api: {
    retryCount: number;
    retryDelay: number;
    timeout: number;
  };
}

export const DEFAULT_CONFIG: MessagingConfig = {
  rabbit: {
    url: 'amqp://localhost',
    retryCount: 3,
    retryDelay: 1000,
    queueOptions: {
      durable: true,
      maxPriority: 10,
      deadLetterExchange: 'dlx',
      messageTtl: 86400000 // 24 hours
    },
    prefetchCount: 1,
    heartbeatInterval: 30000,
    reconnectDelay: 5000
  },
  api: {
    retryCount: 3,
    retryDelay: 1000,
    timeout: 5000
  }
};


