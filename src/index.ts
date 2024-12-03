import "reflect-metadata";

// Core exports
export * from './interfaces';
export * from './types';
export * from './constants';

// Services
export * from './MessagingService';
export * from './ApiMessagingService';
export * from './RabbitMqMessagingService';
export * from './MonitoringService';
export * from './MessagingContext';

// Configuration
export * from './core/types/config.types';
export * from './builders/config.builder';
export { MessagingFactory } from './messaging.factory';

// Optional container export for advanced usage
export { container } from './container';
