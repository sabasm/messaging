import 'reflect-metadata';
import { RabbitMessagingService } from '../services/messaging/RabbitMessagingService';
import { MockMonitoringService } from './mocks/MockMonitoringService';
import { Channel, Connection } from 'amqplib';
import { Message } from '../types';
import { IConnectionManager } from '../infrastructure/amqp/IConnectionManager';

class ExtendedMockConnectionManager implements IConnectionManager {
  connect = jest.fn();
  createChannel = jest.fn();
}

describe('RabbitMessagingService Extended Tests', () => {
  let service: RabbitMessagingService;
  let monitoring: MockMonitoringService;
  let mockChannel: jest.Mocked<Channel>;
  let mockConnection: jest.Mocked<Connection>;
  let mockConnectionManager: ExtendedMockConnectionManager;

  beforeEach(() => {
    jest.resetAllMocks();

    mockChannel = {
      assertQueue: jest.fn(),
      sendToQueue: jest.fn(),
      close: jest.fn(),
      on: jest.fn(),
    } as unknown as jest.Mocked<Channel>;

    mockConnection = {
      createChannel: jest.fn().mockResolvedValue(mockChannel),
      close: jest.fn(),
      on: jest.fn(),
    } as unknown as jest.Mocked<Connection>;

    mockConnectionManager = new ExtendedMockConnectionManager();
    mockConnectionManager.connect.mockResolvedValue(mockConnection);
    mockConnectionManager.createChannel.mockResolvedValue(mockChannel);

    monitoring = new MockMonitoringService();
    service = new RabbitMessagingService(monitoring, mockConnectionManager);
  });

  const message: Message = {
    id: '1',
    payload: { test: true },
  };

  describe('connection management', () => {
    it('should handle connection timeouts', async () => {
      mockConnectionManager.connect.mockRejectedValue(new Error('Connection timeout'));

      await expect(service.sendMessage('test', message)).rejects.toThrow('Connection timeout');
      expect(monitoring.getMetricCount('connection_errors')).toBe(1);
    });

    it('should handle channel creation failures', async () => {
      mockConnectionManager.createChannel.mockRejectedValue(new Error('Channel creation failed'));

      await expect(service.sendMessage('test', message)).rejects.toThrow('Channel creation failed');
      expect(monitoring.getMetricCount('connection_errors')).toBe(1);
    });

    it('should handle connection loss during operation', async () => {
      mockChannel.sendToQueue.mockImplementation(() => {
        throw new Error('Connection lost');
      });

      await expect(service.sendMessage('test', message)).rejects.toThrow('Connection lost');
      expect(monitoring.getMetricCount('connection_errors')).toBe(1);
    });
  });

  describe('queue operations', () => {
    it('should handle queue declaration failures', async () => {
      mockChannel.assertQueue.mockRejectedValue(new Error('Queue declaration failed'));

      await expect(service.sendMessage('test', message)).rejects.toThrow('Queue declaration failed');
      expect(monitoring.getMetricCount('connection_errors')).toBe(1);
    });

    it('should handle message serialization errors', async () => {
      const circularRef: Record<string, unknown> = {};
      circularRef.self = circularRef;

      const invalidMessage: Message = {
        id: '1',
        payload: { circular: circularRef },
      };

      await expect(service.sendMessage('test', invalidMessage)).rejects.toThrow();
      expect(monitoring.getMetricCount('message_processing_errors')).toBe(1);
    });
  });

  describe('batch operations', () => {
    const messages = [message, { ...message, id: '2' }];

    it('should handle partial batch failures', async () => {
      mockChannel.sendToQueue
        .mockReturnValueOnce(true)
        .mockImplementationOnce(() => {
          throw new Error('Partial failure');
        });

      await expect(service.sendBatch('test', messages)).rejects.toThrow('Partial failure');
      expect(monitoring.getMetricCount('messages_sent')).toBe(1);
    });

    it('should handle cleanup after partial success', async () => {
      mockChannel.sendToQueue
        .mockReturnValueOnce(true)
        .mockImplementationOnce(() => {
          throw new Error('Partial failure');
        });

      await expect(service.sendBatch('test', messages)).rejects.toThrow();
      expect(mockChannel.close).toHaveBeenCalled();
      expect(mockConnection.close).toHaveBeenCalled();
    });
  });
}


