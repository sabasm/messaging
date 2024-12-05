export interface IMessagingConfig {
    type: 'hybrid' | 'api' | 'rabbit' | 'hybrid-rabbit';
    api?: {
        baseUrl: string;
        timeout: number;
        retryCount: number;
        retryDelay: number;
        healthCheck: {
            enabled: boolean;
            interval: number;
        }
    };
    rabbitmq?: {
        url: string;
        retryCount: number;
        prefetch: number;
        queues: Record<string, string>;
    };
    monitoring: {
        enabled: boolean;
        metricsPrefix: string;
        flushInterval: number;
    };
    fallback?: {
        enabled: boolean;
        strategy: 'api' | 'rabbitmq';
    };
}
