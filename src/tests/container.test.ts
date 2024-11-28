import { container } from '../container';
import { TYPES } from '../constants';
import { IMessagingService, IMonitoringService } from '../interfaces';
import { ApiMessagingService } from '../ApiMessagingService';
import { RabbitMqMessagingService } from '../RabbitMqMessagingService';
import { MonitoringService } from '../MonitoringService';

describe('Container Configuration', () => {
  beforeEach(() => {
    container.snapshot();
  });

  afterEach(() => {
    container.restore();
  });

  it('should bind MonitoringService as singleton', () => {
    const instance1 = container.get<IMonitoringService>(TYPES.MonitoringService);
    const instance2 = container.get<IMonitoringService>(TYPES.MonitoringService);
    
    expect(instance1).toBeInstanceOf(MonitoringService);
    expect(instance1).toBe(instance2);
  });

  it('should bind ApiMessagingService', () => {
    const instance = container.get<IMessagingService>(TYPES.MessagingService);
    expect(instance).toBeInstanceOf(ApiMessagingService);
  });

  it('should bind RabbitMqMessagingService as fallback', () => {
    const instance = container.get<IMessagingService>(TYPES.FallbackMessagingService);
    expect(instance).toBeInstanceOf(RabbitMqMessagingService);
  });
});


