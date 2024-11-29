import { MetricLabels } from './core/types/metrics';
import { Message } from './types';

export interface IMessagingService {
 init(): Promise<void>;
 dispose(): Promise<void>;
 sendMessage(destination: string, message: Message): Promise<void>;
 sendBatch(destination: string, messages: Message[]): Promise<void>;
}

export interface IMonitoringService {
 increment(metric: string, labels?: MetricLabels): void;
 gauge(metric: string, value: number, labels?: MetricLabels): void;
 histogram(metric: string, value: number, labels?: MetricLabels): void;
}


