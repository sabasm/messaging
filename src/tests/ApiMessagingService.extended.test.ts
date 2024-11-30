import axios from 'axios';
import { ApiMessagingService } from '../services/messaging/ApiMessagingService';
import { MockMonitoringService } from './mocks/MockMonitoringService';
import { HttpClient } from '../core/types/http.types';
import { Container } from 'inversify';
import { TYPES } from '../constants';
import { Message } from '../types';
import { IMonitoringService } from '../interfaces';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

class MockHttpClient implements HttpClient {
  async post<T>(url: string, data: T): Promise<void> {
    return mockedAxios.post(url, data);
  }
}

describe('ApiMessagingService Extended Tests', () => {
  let container: Container;
  let service: ApiMessagingService;
  let monitoring: MockMonitoringService;
  let httpClient: MockHttpClient;

  beforeEach(() => {
    container = new Container();
    monitoring = new MockMonitoringService();
    httpClient = new MockHttpClient();

    container.bind<IMonitoringService>(TYPES.MonitoringService).toConstantValue(monitoring);
    container.bind<HttpClient>(TYPES.HttpClient).toConstantValue(httpClient);
    container.bind<ApiMessagingService>(TYPES.MessagingService).to(ApiMessagingService);

    service = container.get<ApiMessagingService>(TYPES.MessagingService);
    monitoring.reset();
    jest.clearAllMocks();
  });

  const message: Message = {
    id: '1',
    payload: { data: 'test' },
  };

  describe('sendMessage', () => {
    it('should successfully send a message', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: 'success' });

      await service.sendMessage('test-endpoint', message);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'test-endpoint',
        expect.objectContaining({
          id: '1',
          payload: { data: 'test' },
          timestamp: expect.any(Date),
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
    });

    it('should fail after max retries', async () => {
      const error = new Error('Network error');
      mockedAxios.post.mockRejectedValue(error);

      await expect(service.sendMessage('test-endpoint', message)).rejects.toThrow('Network error');

      expect(mockedAxios.post).toHaveBeenCalledTimes(3);
      expect(monitoring.getMetricCount('messages_failed', { destination: 'test-endpoint' })).toBe(3);
    });
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
          expect.objectContaining({ id: '2' }),
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
    });

    it('should fail after max retries', async () => {
      const error = new Error('Network error');
      mockedAxios.post.mockRejectedValue(error);

      await expect(service.sendBatch('test-endpoint', messages)).rejects.toThrow('Network error');

      expect(mockedAxios.post).toHaveBeenCalledTimes(3);
      expect(monitoring.getMetricCount('messages_failed', { destination: 'test-endpoint', batch: 'true' })).toBe(3);
    });
  });
});
