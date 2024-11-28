import { Container } from 'inversify';
import { TYPES } from '../../core/types/constants';
import { MessagingContext } from '../../MessagingContext';
import { Message } from '../../types/message.types';
import { IMessagingService, IMonitoringService } from '../../interfaces';
import { ApiMessagingService } from '../../ApiMessagingService';
import { RabbitMqMessagingService } from '../../RabbitMqMessagingService';
import { MockMonitoringService } from '../MockMonitoringService';
import { MessagingConfig, DEFAULT_CONFIG } from '../../config/messaging.config';

describe('Messaging Integration', () => {
  let messagingContext: MessagingContext;
  let testContainer: Container;
  let monitoring: MockMonitoringService;

  beforeEach(() => {
    testContainer = new Container();
    monitoring = new MockMonitoringService();
    
    testContainer.bind<IMonitoringService>(TYPES.MonitoringService)
      .toConstantValue(monitoring);
    testContainer.bind<MessagingConfig>('Config')
      .toConstantValue(DEFAULT_CONFIG);
    testContainer.bind<IMessagingService>(TYPES.MessagingService)
      .to(ApiMessagingService)
      .inSingletonScope();
    testContainer.bind<IMessagingService>(TYPES.FallbackMessagingService)
      .to(RabbitMqMessagingService)
      .inSingletonScope();
    testContainer.bind<MessagingContext>(TYPES.MessagingContext)
      .to(MessagingContext)
      .inSingletonScope();

    messagingContext = testContainer.get<MessagingContext>(TYPES.MessagingContext);
  });

  afterEach(() => {
    monitoring.reset();
    testContainer.unbindAll();
  });

  const testMessage: Message = {
    id: 'test-1',
    timestamp: new Date(),
    payload: { test: 'data' }
  };

  it('should send message through the pipeline', async () => {
    await expect(messagingContext.sendMessage('test-destination', testMessage))
      .resolves
      .not.toThrow();
  });

  it('should send batch through the pipeline', async () => {
    const messages = [testMessage, { ...testMessage, id: 'test-2' }];
    await expect(messagingContext.sendBatch('test-destination', messages))
      .resolves
      .not.toThrow();
  });
});

