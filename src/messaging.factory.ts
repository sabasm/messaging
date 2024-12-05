import { Container } from 'inversify';
import { TYPES } from './constants';
import { MessagingContext } from './MessagingContext';
import { ApiMessagingService } from './ApiMessagingService';
import { RabbitMqMessagingService } from './RabbitMqMessagingService';
import { MonitoringService } from './MonitoringService';
import { MessagingConfig } from './core/types/config.types';

export class MessagingFactory {
  private container: Container;

  constructor(private config: MessagingConfig) {
    this.container = new Container();
    this.setupContainer();
  }

  private setupContainer(): void {
    this.container.bind(TYPES.Config).toConstantValue(this.config);
    this.container.bind(TYPES.MonitoringService).to(MonitoringService).inSingletonScope();

    if (this.config.api?.baseUrl) {
      this.container.bind(TYPES.MessagingService).to(ApiMessagingService).inSingletonScope();
    } else if (this.config.rabbitmq?.url) {
      this.container.bind(TYPES.MessagingService).to(RabbitMqMessagingService).inSingletonScope();
    }

    if (this.config.fallback?.enabled !== false) {
      if (this.config.rabbitmq?.url) {
        this.container.bind(TYPES.FallbackMessagingService).to(RabbitMqMessagingService).inSingletonScope();
      }
    }

    this.container.bind(TYPES.MessagingContext).to(MessagingContext).inSingletonScope();
  }

  create(): MessagingContext {
    return this.container.get<MessagingContext>(TYPES.MessagingContext);
  }
}
