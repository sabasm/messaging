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
import { HttpClient } from './core/types/http.types';
import { AxiosHttpClient } from './infrastructure/http/axios.client';

const container = new Container({ defaultScope: 'Singleton' });

container.bind<HttpClient>(TYPES.HttpClient).to(AxiosHttpClient).inSingletonScope();
container.bind<IMonitoringService>(TYPES.MonitoringService).to(MonitoringService).inSingletonScope();
container.bind<IMessagingService>(TYPES.MessagingService).to(ApiMessagingService).inSingletonScope();
container.bind<IMessagingService>(TYPES.FallbackMessagingService).to(RabbitMqMessagingService).inSingletonScope();
container.bind<IConnectionManager>(TYPES.ConnectionManager).to(ConnectionManager).inSingletonScope();
container.bind(TYPES.Config).toConstantValue(BaseConfig.getInstance());
container.bind<MessagingContext>(TYPES.MessagingContext).toDynamicValue((context) => {
  const primary = context.container.get<IMessagingService>(TYPES.MessagingService);
  const fallback = context.container.get<IMessagingService>(TYPES.FallbackMessagingService);
  return new MessagingContext(primary, fallback);
}).inSingletonScope();

export { container };


