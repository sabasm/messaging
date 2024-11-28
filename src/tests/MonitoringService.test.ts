import { MonitoringService } from '../MonitoringService';
import { IMonitoringService, MetricLabels } from '../interfaces/monitoring.interface';

describe('MonitoringService', () => {
  let service: MonitoringService;

  beforeEach(() => {
    service = new MonitoringService();
  });

  it('should increment metrics without labels', () => {
    expect(() => {
      service.increment('test_metric');
    }).not.toThrow();
  });

  it('should increment metrics with labels', () => {
    expect(() => {
      service.increment('test_metric', { destination: 'test-dest' });
    }).not.toThrow();
  });

  it('should record gauge metrics without labels', () => {
    expect(() => {
      service.gauge('test_gauge', 100);
    }).not.toThrow();
  });

  it('should record gauge metrics with labels', () => {
    expect(() => {
      service.gauge('test_gauge', 200, { destination: 'test-dest' });
    }).not.toThrow();
  });

  it('should record histogram metrics without labels', () => {
    expect(() => {
      service.histogram('test_histogram', 300);
    }).not.toThrow();
  });

  it('should record histogram metrics with labels', () => {
    expect(() => {
      service.histogram('test_histogram', 400, { destination: 'test-dest' });
    }).not.toThrow();
  });
});


