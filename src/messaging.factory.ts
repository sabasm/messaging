import { Container } from 'inversify';
import { TYPES } from './constants'; 
import { MessagingContext } from './MessagingContext';
import { ApiMessagingService } from './ApiMessagingService';
import { RabbitMqMessagingService } from './RabbitMqMessagingService';
import { MonitoringService } from './MonitoringService';
import { MessagingConfig } from './core/types/config.types';
import { Middleware } from './core/types/middleware.types';
import { MessagingConfigBuilder } from './builders/config.builder';

export class MessagingFactory {
 private container: Container;

 constructor(private config: MessagingConfig, private middlewares: Middleware[] = []) {
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

   if (this.config.fallback?.enabled !== false && this.config.rabbitmq?.url) {
     this.container.bind(TYPES.FallbackMessagingService).to(RabbitMqMessagingService).inSingletonScope();
   }

   this.container.bind(TYPES.MessagingContext).to(MessagingContext).inSingletonScope();
 }

 create(): MessagingContext {
   const context = this.container.get<MessagingContext>(TYPES.MessagingContext);
   this.middlewares.forEach(middleware => context.useMiddleware(middleware));
   return context;
 }

 static builder(): MessagingConfigBuilder {
   return new MessagingConfigBuilder();
 }
}


