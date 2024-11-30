import { injectable } from 'inversify';
import { IMonitoringService } from '../../interfaces';
import { Message } from '../../types';

@injectable()
export abstract class BaseMessagingService {
  private isInitialized = false;

  constructor(protected monitoring: IMonitoringService) {}

  protected async initialize(): Promise<void> {
    if (!this.isInitialized) {
      this.monitoring.increment(`${this.getServiceName()}_initialized`, { state: 'init' });
      this.isInitialized = true;
    }
  }

  protected async cleanup(): Promise<void> {
    if (this.isInitialized) {
      this.monitoring.increment(`${this.getServiceName()}_disposed`, { state: 'disposed' });
      this.isInitialized = false;
    }
  }

  protected abstract getServiceName(): string;

  protected preprocessMessage(message: Message): Message {
    return {
      ...message,
      timestamp: new Date(),
    };
  }

  abstract sendMessage(destination: string, message: Message): Promise<void>;
  abstract sendBatch(destination: string, messages: Message[]): Promise<void>;
}


