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

    // Configure primary messaging service based on config
    if (this.config.messaging.api?.baseUrl) {
      this.container.bind(TYPES.MessagingService).to(ApiMessagingService).inSingletonScope();
    } else if (this.config.messaging.rabbitmq?.url) {
      this.container.bind(TYPES.MessagingService).to(RabbitMqMessagingService).inSingletonScope();
    }

    // Configure fallback if enabled
    if (this.config.messaging.fallback?.enabled !== false) {
      if (this.config.messaging.rabbitmq?.url) {
        this.container.bind(TYPES.FallbackMessagingService).to(RabbitMqMessagingService).inSingletonScope();
      }
    }

    this.container.bind(TYPES.MessagingContext).to(MessagingContext).inSingletonScope();
  }

  create(): MessagingContext {
    return this.container.get<MessagingContext>(TYPES.MessagingContext);
  }
}


