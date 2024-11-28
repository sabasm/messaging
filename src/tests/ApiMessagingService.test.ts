import { ApiMessagingService } from '../ApiMessagingService';
import { MockMonitoringService } from './MockMonitoringService';
import axios from 'axios';
import { Message } from '../types';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ApiMessagingService', () => {
  let service: ApiMessagingService;
  let monitoring: MockMonitoringService;

  beforeEach(() => {
    monitoring = new MockMonitoringService();
    service = new ApiMessagingService(monitoring);
    monitoring.reset();
    jest.clearAllMocks();
  });

  const message: Message = {
    id: '1',
    timestamp: new Date(),
    payload: { data: 'test' }
  };

  describe('sendMessage', () => {
    it('should successfully send a message', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: 'success' });

      await service.sendMessage('test-endpoint', message);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'test-endpoint',
        expect.objectContaining({
          id: '1',
          payload: { data: 'test' }
        }),
        expect.any(Object)
      );
      expect(monitoring.getMetricCount('messages_sent', { destination: 'test-endpoint' })).toBe(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      mockedAxios.post
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ data: 'success' });

      await service.sendMessage('test-endpoint', message);

      expect(mockedAxios.post).toHaveBeenCalledTimes(2);
      expect(monitoring.getMetricCount('messages_sent', { destination: 'test-endpoint' })).toBe(1);
      expect(monitoring.getMetricCount('messages_failed', { destination: 'test-endpoint' })).toBe(1);
    }, 10000);

    it('should fail after max retries', async () => {
      const error = new Error('Network error');
      mockedAxios.post.mockRejectedValue(error);

      await expect(service.sendMessage('test-endpoint', message))
        .rejects
        .toBe(error);

      expect(mockedAxios.post).toHaveBeenCalledTimes(3);
      expect(monitoring.getMetricCount('messages_failed', { destination: 'test-endpoint' })).toBe(3);
    }, 10000);

    it('should handle non-Error rejection', async () => {
      const errorValue = 'Unknown error';
      mockedAxios.post.mockRejectedValue(errorValue);

      await expect(service.sendMessage('test-endpoint', message))
        .rejects
        .toBe(errorValue);

      expect(monitoring.getMetricCount('messages_failed', { destination: 'test-endpoint' })).toBe(3);
    }, 10000);
  });

  describe('sendBatch', () => {
    const messages = [message, { ...message, id: '2' }];

    it('should successfully send a batch of messages', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: 'success' });

      await service.sendBatch('test-endpoint', messages);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'test-endpoint',
        expect.arrayContaining([
          expect.objectContaining({ id: '1' }),
          expect.objectContaining({ id: '2' })
        ]),
        expect.any(Object)
      );
      expect(monitoring.getMetricCount('messages_sent', { destination: 'test-endpoint', batch: 'true' })).toBe(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      mockedAxios.post
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ data: 'success' });

      await service.sendBatch('test-endpoint', messages);

      expect(mockedAxios.post).toHaveBeenCalledTimes(2);
      expect(monitoring.getMetricCount('messages_sent', { destination: 'test-endpoint', batch: 'true' })).toBe(1);
      expect(monitoring.getMetricCount('messages_failed', { destination: 'test-endpoint', batch: 'true' })).toBe(1);
    }, 10000);

    it('should fail after max retries', async () => {
      const error = new Error('Network error');
      mockedAxios.post.mockRejectedValue(error);

      await expect(service.sendBatch('test-endpoint', messages))
        .rejects
        .toBe(error);

      expect(mockedAxios.post).toHaveBeenCalledTimes(3);
      expect(monitoring.getMetricCount('messages_failed', { destination: 'test-endpoint', batch: 'true' })).toBe(3);
    }, 10000);
  });
})
