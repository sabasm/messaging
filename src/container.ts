import { Container } from 'inversify';
import { TYPES } from './constants';
import { IMessagingService, IMonitoringService } from './interfaces';
import { ApiMessagingService } from './ApiMessagingService';
import { RabbitMqMessagingService } from './RabbitMqMessagingService';
import { MonitoringService } from './MonitoringService';
import { MessagingContext } from './MessagingContext';
import { ConnectionManager } from './infrastructure/amqp/ConnectionManager';
import { IConnectionManager } from './infrastructure/amqp/IConnectionManager';
import { BaseConfig } from './config/base.config';
import { MiddlewareChain } from './middleware/implementation/middleware-chain';

const container = new Container({ defaultScope: 'Singleton' });

container.bind<IMonitoringService>(TYPES.MonitoringService).to(MonitoringService).inSingletonScope();
container.bind<IMessagingService>(TYPES.MessagingService).to(ApiMessagingService).inSingletonScope();
container.bind<IMessagingService>(TYPES.FallbackMessagingService).to(RabbitMqMessagingService).inSingletonScope();
container.bind<IConnectionManager>(TYPES.ConnectionManager).to(ConnectionManager).inSingletonScope();
container.bind(TYPES.Config).toConstantValue(BaseConfig.getInstance());
container.bind<MiddlewareChain>(TYPES.MiddlewareChain).to(MiddlewareChain).inSingletonScope();
container.bind<MessagingContext>(TYPES.MessagingContext).to(MessagingContext).inSingletonScope();

export { container };


