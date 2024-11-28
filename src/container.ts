import { Container } from 'inversify';
import { TYPES } from './constants';
import { IMessagingService, IMonitoringService } from './interfaces';
import { ApiMessagingService } from './ApiMessagingService';
import { RabbitMqMessagingService } from './RabbitMqMessagingService';
import { MonitoringService } from './MonitoringService';
import { MessagingContext } from './MessagingContext';

const container = new Container({ defaultScope: 'Singleton' });

container.bind<IMonitoringService>(TYPES.MonitoringService).to(MonitoringService).inSingletonScope();
container.bind<IMessagingService>(TYPES.MessagingService).to(ApiMessagingService).inSingletonScope();
container.bind<IMessagingService>(TYPES.FallbackMessagingService).to(RabbitMqMessagingService).inSingletonScope();
container.bind<MessagingContext>(TYPES.MessagingContext).toDynamicValue((context) => {
  const primary = context.container.get<IMessagingService>(TYPES.MessagingService);
  const fallback = context.container.get<IMessagingService>(TYPES.FallbackMessagingService);
  return new MessagingContext(primary, fallback);
}).inSingletonScope();

export { container };


