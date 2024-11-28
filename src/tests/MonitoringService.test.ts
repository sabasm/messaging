import { MonitoringService } from '../MonitoringService';

describe('MonitoringService', () => {
  let service: MonitoringService;

  beforeEach(() => {
    service = new MonitoringService();
  });

  it('should not throw when incrementing metrics', () => {
    expect(() => {
      service.increment('test_metric');
      service.increment('test_metric', { label: 'value' });
    }).not.toThrow();
  });
});


