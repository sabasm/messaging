import { Message } from './types';

export interface IMessagingService {
  sendMessage(destination: string, message: Message): Promise<void>;
  sendBatch(destination: string, messages: Message[]): Promise<void>;
}

export interface IMonitoringService {
  increment(metric: string, labels?: Record<string, string>): void;
}

