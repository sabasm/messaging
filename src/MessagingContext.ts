import { injectable, inject } from 'inversify';
import { IMessagingService } from './interfaces';
import { TYPES } from './constants';
import { Message } from './types/message.types';
import { MiddlewareChain } from './middleware/implementation/middleware-chain';
import { Context, Middleware } from './middleware/types';

@injectable()
export class MessagingContext {
  private middlewareChain: MiddlewareChain;
  private isInitialized = false;

  constructor(
    @inject(TYPES.MessagingService) private strategy: IMessagingService,
    @inject(TYPES.FallbackMessagingService) private fallbackStrategy?: IMessagingService,
    @inject(TYPES.MiddlewareChain) middlewareChain?: MiddlewareChain
  ) {
    this.middlewareChain = middlewareChain || new MiddlewareChain();
  }

  useMiddleware(middleware: Middleware): void {
    this.middlewareChain.add(middleware);
  }

  setStrategy(strategy: IMessagingService): void {
    if (!strategy) {
      throw new Error('Strategy cannot be null or undefined');
    }
    this.strategy = strategy;
  }

  setFallbackStrategy(fallback: IMessagingService): void {
    this.fallbackStrategy = fallback;
  }

  async init(): Promise<void> {
    if (this.isInitialized) return;

    await this.strategy.init();
    if (this.fallbackStrategy) {
      await this.fallbackStrategy.init();
    }
    this.isInitialized = true;
  }

  async dispose(): Promise<void> {
    if (!this.isInitialized) return;

    await this.strategy.dispose();
    if (this.fallbackStrategy) {
      await this.fallbackStrategy.dispose();
    }
    this.isInitialized = false;
  }

  async sendMessage(destination: string, message: Message): Promise<void> {
    if (!this.isInitialized) {
      await this.init();
    }

    const context: Context = {
      destination,
      message: {
        ...message,
        timestamp: new Date(),
        metadata: {
          ...message.metadata,
          headers: {
            ...message.metadata?.headers,
            'x-destination': destination,
            'x-timestamp': new Date().toISOString()
          }
        }
      },
      metadata: {}
    };

    await this.middlewareChain.execute(context);

    try {
      await this.strategy.sendMessage(destination, context.message);
    } catch (error) {
      if (!this.fallbackStrategy) {
        throw new Error('No fallback strategy configured');
      }
      try {
        await this.fallbackStrategy.sendMessage(destination, context.message);
      } catch {
        throw new Error('Primary and fallback strategies failed');
      }
    }
  }

  async sendBatch(destination: string, messages: Message[]): Promise<void> {
    if (!this.isInitialized) {
      await this.init();
    }

    const processedMessages = await Promise.all(
      messages.map(async (message) => {
        const context: Context = {
          destination,
          message: {
            ...message,
            timestamp: new Date(),
            metadata: {
              ...message.metadata,
              headers: {
                ...message.metadata?.headers,
                'x-destination': destination,
                'x-timestamp': new Date().toISOString()
              }
            }
          },
          metadata: {}
        };
        await this.middlewareChain.execute(context);
        return context.message;
      })
    );

    try {
      await this.strategy.sendBatch(destination, processedMessages);
    } catch (error) {
      if (!this.fallbackStrategy) {
        throw new Error('No fallback strategy configured');
      }
      try {
        await this.fallbackStrategy.sendBatch(destination, processedMessages);
      } catch {
        throw new Error('Primary and fallback strategies failed');
      }
    }
  }
}
