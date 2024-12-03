// src/MessagingContext.ts
import { injectable, inject } from 'inversify';
import { IMessagingService } from './interfaces';
import { TYPES } from './constants';
import { Message } from './types';

@injectable()
export class MessagingContext {
  private strategy: IMessagingService;
  private fallbackStrategy?: IMessagingService;

  constructor(
    @inject(TYPES.MessagingService) strategy: IMessagingService,
    @inject(TYPES.FallbackMessagingService) fallbackStrategy?: IMessagingService
  ) {
    this.strategy = strategy;
    this.fallbackStrategy = fallbackStrategy;
  }

  setStrategy(strategy: IMessagingService): void {
    this.strategy = strategy;
  }

  setFallbackStrategy(fallback: IMessagingService): void {
    this.fallbackStrategy = fallback;
  }

  async init(): Promise<void> {
    await this.strategy.init();
    if (this.fallbackStrategy) {
      await this.fallbackStrategy.init();
    }
  }

  async dispose(): Promise<void> {
    await this.strategy.dispose();
    if (this.fallbackStrategy) {
      await this.fallbackStrategy.dispose();
    }
  }

  async sendMessage(destination: string, message: Message): Promise<void> {
    try {
      await this.strategy.sendMessage(destination, message);
    } catch (error) {
      if (this.fallbackStrategy) {
        try {
          await this.fallbackStrategy.sendMessage(destination, message);
        } catch {
          throw new Error('Primary and fallback strategies failed');
        }
      } else {
        throw new Error('Primary and fallback strategies failed');
      }
    }
  }

  async sendBatch(destination: string, messages: Message[]): Promise<void> {
    try {
      await this.strategy.sendBatch(destination, messages);
    } catch (error) {
      if (this.fallbackStrategy) {
        try {
          await this.fallbackStrategy.sendBatch(destination, messages);
        } catch {
          throw new Error('Primary and fallback strategies failed');
        }
      } else {
        throw new Error('Primary and fallback strategies failed');
      }
    }
  }
}
