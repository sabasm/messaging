import { MockMonitoringService } from './MockMonitoringService';

describe('MockMonitoringService', () => {
  let service: MockMonitoringService;

  beforeEach(() => {
    service = new MockMonitoringService();
    service.reset();
  });

  it('should increment metrics correctly', () => {
    service.increment('test_metric');
    service.increment('test_metric');
    expect(service.getMetricCount('test_metric')).toBe(2);
  });

  it('should record gauge metrics correctly', () => {
    service.gauge('test_gauge', 100);
    service.gauge('test_gauge', 200, { destination: 'queue1' });
    expect(service.getMetricCount('test_gauge')).toBe(100);
    expect(service.getMetricCount('test_gauge', { destination: 'queue1' })).toBe(200);
  });

  it('should record histogram metrics correctly', () => {
    service.histogram('test_histogram', 300);
    service.histogram('test_histogram', 400, { destination: 'queue2' });
    expect(service.getMetricCount('test_histogram')).toBe(300);
    expect(service.getMetricCount('test_histogram', { destination: 'queue2' })).toBe(400);
  });

  it('should reset metrics correctly', () => {
    service.increment('test_metric');
    service.gauge('test_gauge', 100);
    service.histogram('test_histogram', 300);
    service.reset();
    expect(service.getMetricCount('test_metric')).toBe(0);
    expect(service.getMetricCount('test_gauge')).toBe(0);
    expect(service.getMetricCount('test_histogram')).toBe(0);
  });
});


