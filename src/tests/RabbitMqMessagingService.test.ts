import { RabbitMqMessagingService } from '../RabbitMqMessagingService';
import { MockMonitoringService } from './MockMonitoringService';
import { Connection, Channel } from 'amqplib';
import { Message } from '../types';

jest.mock('amqplib', () => ({
  connect: jest.fn()
}));

describe('RabbitMqMessagingService', () => {
  let service: RabbitMqMessagingService;
  let monitoring: MockMonitoringService;
  let mockChannel: jest.Mocked<Channel>;
  let mockConnection: jest.Mocked<Connection>;

  beforeEach(() => {
    monitoring = new MockMonitoringService();
    service = new RabbitMqMessagingService(monitoring);

    mockChannel = {
      assertQueue: jest.fn().mockResolvedValue(undefined),
      sendToQueue: jest.fn().mockReturnValue(true),
      close: jest.fn().mockResolvedValue(undefined)
    } as unknown as jest.Mocked<Channel>;

    mockConnection = {
      createChannel: jest.fn().mockResolvedValue(mockChannel),
      close: jest.fn().mockResolvedValue(undefined),
      on: jest.fn()
    } as unknown as jest.Mocked<Connection>;

    (require('amqplib').connect as jest.Mock).mockResolvedValue(mockConnection);

    jest.spyOn(service, 'delay').mockImplementation(() => Promise.resolve());

    monitoring.reset();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const message: Message = {
    id: '1',
    timestamp: new Date(),
    payload: { data: 'test' },
    metadata: { priority: 1, delay: 1000 }
  };

  describe('sendMessage', () => {
    it('should successfully send a message', async () => {
      await service.sendMessage('test-queue', message);

      expect(mockChannel.assertQueue).toHaveBeenCalledWith(
        'test-queue',
        expect.any(Object)
      );
      expect(mockChannel.sendToQueue).toHaveBeenCalledWith(
        'test-queue',
        expect.any(Buffer),
        expect.objectContaining({
          priority: 1,
          headers: { 'x-delay': 1000 }
        })
      );
      expect(monitoring.getMetricCount('messages_sent', { destination: 'test-queue' })).toBe(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      mockChannel.sendToQueue
        .mockReturnValueOnce(false)
        .mockReturnValue(true);

      await service.sendMessage('test-queue', message);

      expect(mockChannel.sendToQueue).toHaveBeenCalledTimes(2);
      expect(monitoring.getMetricCount('messages_sent', { destination: 'test-queue' })).toBe(1);
      expect(monitoring.getMetricCount('messages_failed', { destination: 'test-queue' })).toBe(1);
    });

    it('should fail after max retries', async () => {
      mockChannel.sendToQueue.mockReturnValue(false);

      await expect(service.sendMessage('test-queue', message)).rejects.toThrow();

      expect(mockChannel.sendToQueue).toHaveBeenCalledTimes(3);
      expect(monitoring.getMetricCount('messages_failed', { destination: 'test-queue' })).toBe(3);
    });
  });

  describe('sendBatch', () => {
    const messages = [message, { ...message, id: '2' }];

    it('should successfully send a batch of messages', async () => {
      await service.sendBatch('test-queue', messages);

      expect(mockChannel.sendToQueue).toHaveBeenCalledTimes(2);
      expect(monitoring.getMetricCount('messages_sent', { destination: 'test-queue', batch: 'true' })).toBe(2);
    });

    it('should handle partial failures in batch', async () => {
      mockChannel.sendToQueue
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(true)
        .mockReturnValue(true);

      await service.sendBatch('test-queue', messages);

      expect(mockChannel.sendToQueue).toHaveBeenCalledTimes(3);
      expect(monitoring.getMetricCount('messages_sent', { destination: 'test-queue', batch: 'true' })).toBe(2);
      expect(monitoring.getMetricCount('messages_failed', { destination: 'test-queue', batch: 'true' })).toBe(1);
    });
  });

  describe('connection management', () => {
    it('should handle connection errors', async () => {
      (require('amqplib').connect as jest.Mock).mockRejectedValue(new Error('Connection failed'));

      await expect(service.sendMessage('test-queue', message))
        .rejects
        .toThrow('Connection failed');

      expect(mockChannel.sendToQueue).not.toHaveBeenCalled();
    });

    it('should close connection and channel', async () => {
      await service.sendMessage('test-queue', message);
      await service.close();

      expect(mockChannel.close).toHaveBeenCalled();
      expect(mockConnection.close).toHaveBeenCalled();
    });
  });
})


