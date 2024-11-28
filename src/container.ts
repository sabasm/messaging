import 'reflect-metadata';
import { Container } from 'inversify';
import { TYPES } from './constants';
import { IMessagingService, IMonitoringService } from './interfaces';
import { ApiMessagingService } from './ApiMessagingService';
import { RabbitMqMessagingService } from './RabbitMqMessagingService';
import { MonitoringService } from './MonitoringService';
import { MessagingContext } from './MessagingContext';

const container = new Container();

container.bind<IMonitoringService>(TYPES.MonitoringService).to(MonitoringService).inSingletonScope();
container.bind<IMessagingService>(TYPES.MessagingService).to(ApiMessagingService);
container.bind<IMessagingService>(TYPES.FallbackMessagingService).to(RabbitMqMessagingService);
container.bind<MessagingContext>(TYPES.MessagingContext).to(MessagingContext);

export { container };


