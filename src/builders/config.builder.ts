import { MessagingConfig } from '../core/types/config.types';
import { DEFAULT_CONFIG } from '../config/messaging.config'; 
import { Middleware } from '../core/types/middleware.types';

export class MessagingConfigBuilder {
 private config: MessagingConfig = DEFAULT_CONFIG;
 private middlewares: Middleware[] = [];

 withApiMessaging(config: Partial<MessagingConfig['api']>): this {
   this.config.api = { ...this.config.api, ...config };
   return this;
 }

 withRabbitMQ(config: Partial<MessagingConfig['rabbitmq']>): this {
   this.config.rabbitmq = { ...this.config.rabbitmq, ...config };
   return this;
 }

 withMonitoring(config: Partial<MessagingConfig['monitoring']>): this {
   this.config.monitoring = { ...this.config.monitoring, ...config };
   return this;
 }

 withFallback(strategy: 'api' | 'rabbitmq'): this {
   this.config.fallback = { enabled: true, strategy };
   return this;
 }

 withMiddleware(middleware: Middleware): this {
   this.middlewares.push(middleware);
   return this;
 }

 build(): { config: MessagingConfig; middlewares: Middleware[] } {
   return { config: this.config, middlewares: this.middlewares };
 }
}


