import { MockMonitoringService } from './MockMonitoringService';

describe('MockMonitoringService', () => {
  let service: MockMonitoringService;

  beforeEach(() => {
    service = new MockMonitoringService();
    service.reset();
  });

  describe('increment()', () => {
    it('should increment metrics without labels', () => {
      service.increment('test_metric');
      service.increment('test_metric');
      expect(service.getMetricCount('test_metric')).toBe(2);
    });

    it('should increment metrics with labels', () => {
      service.increment('test_metric', { destination: 'queue1' });
      service.increment('test_metric', { destination: 'queue1' });
      expect(service.getMetricCount('test_metric', { destination: 'queue1' })).toBe(2);
    });

    it('should differentiate metrics based on labels', () => {
      service.increment('test_metric', { destination: 'queue1' });
      service.increment('test_metric', { destination: 'queue2' });
      expect(service.getMetricCount('test_metric', { destination: 'queue1' })).toBe(1);
      expect(service.getMetricCount('test_metric', { destination: 'queue2' })).toBe(1);
    });
  });

  describe('gauge()', () => {
    it('should record gauge metrics without labels', () => {
      service.gauge('test_gauge', 100);
      expect(service.getMetricCount('test_gauge')).toBe(100);
    });

    it('should record gauge metrics with labels', () => {
      service.gauge('test_gauge', 200, { destination: 'queue1' });
      expect(service.getMetricCount('test_gauge', { destination: 'queue1' })).toBe(200);
    });

    it('should overwrite gauge metrics for the same label', () => {
      service.gauge('test_gauge', 100, { destination: 'queue1' });
      service.gauge('test_gauge', 300, { destination: 'queue1' });
      expect(service.getMetricCount('test_gauge', { destination: 'queue1' })).toBe(300);
    });
  });

  describe('histogram()', () => {
    it('should record histogram metrics without labels', () => {
      service.histogram('test_histogram', 300);
      expect(service.getMetricCount('test_histogram')).toBe(300);
    });

    it('should record histogram metrics with labels', () => {
      service.histogram('test_histogram', 400, { destination: 'queue2' });
      expect(service.getMetricCount('test_histogram', { destination: 'queue2' })).toBe(400);
    });

    it('should overwrite histogram metrics for the same label', () => {
      service.histogram('test_histogram', 300, { destination: 'queue2' });
      service.histogram('test_histogram', 500, { destination: 'queue2' });
      expect(service.getMetricCount('test_histogram', { destination: 'queue2' })).toBe(500);
    });
  });

  describe('reset()', () => {
    it('should reset all metrics', () => {
      service.increment('test_metric');
      service.gauge('test_gauge', 100);
      service.histogram('test_histogram', 300);

      service.reset();

      expect(service.getMetricCount('test_metric')).toBe(0);
      expect(service.getMetricCount('test_gauge')).toBe(0);
      expect(service.getMetricCount('test_histogram')).toBe(0);
    });

    it('should reset metrics with labels', () => {
      service.increment('test_metric', { destination: 'queue1' });
      service.gauge('test_gauge', 100, { destination: 'queue1' });
      service.histogram('test_histogram', 300, { destination: 'queue1' });

      service.reset();

      expect(service.getMetricCount('test_metric', { destination: 'queue1' })).toBe(0);
      expect(service.getMetricCount('test_gauge', { destination: 'queue1' })).toBe(0);
      expect(service.getMetricCount('test_histogram', { destination: 'queue1' })).toBe(0);
    });
  });
});
