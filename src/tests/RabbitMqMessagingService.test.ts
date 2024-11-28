import 'reflect-metadata';
import { RabbitMqMessagingService } from '../RabbitMqMessagingService';
import { MockMonitoringService } from './MockMonitoringService';
import { Channel, Connection } from 'amqplib';
import { Message } from '../types/message.types';
import { IConnectionManager } from '../infrastructure/amqp/IConnectionManager';

jest.mock('../infrastructure/amqp/ConnectionManager');

class MockConnectionManager implements IConnectionManager {
  connect = jest.fn();
  createChannel = jest.fn();
}

describe('RabbitMqMessagingService', () => {
  let service: RabbitMqMessagingService;
  let monitoring: MockMonitoringService;
  let mockChannel: jest.Mocked<Channel>;
  let mockConnection: jest.Mocked<Connection>;
  let mockConnectionManager: MockConnectionManager;

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

    mockConnectionManager = new MockConnectionManager();

    mockConnectionManager.connect.mockResolvedValue(mockConnection);
    mockConnectionManager.createChannel.mockResolvedValue(mockChannel);

    monitoring = new MockMonitoringService();
    service = new RabbitMqMessagingService(monitoring, mockConnectionManager);
  });

  it('should handle connection errors', async () => {
    mockConnectionManager.connect.mockRejectedValueOnce(new Error('Connection failed'));

    await expect(
      service.sendMessage('test-queue', { id: '1', payload: {}, timestamp: new Date() })
    ).rejects.toThrow('Failed to process messages in queue "test-queue": Connection failed');

    expect(monitoring.getMetricCount('connection_errors', { error: 'Connection failed', batch: 'false', destination: 'test-queue' })).toBe(1);
    expect(mockChannel.sendToQueue).not.toHaveBeenCalled();
  });

  it('should handle batch message sending', async () => {
    mockChannel.sendToQueue.mockReturnValue(true);
    const messages: Message[] = [
      { id: '1', payload: {}, timestamp: new Date() },
      { id: '2', payload: {}, timestamp: new Date() },
    ];

    await service.sendBatch('test-queue', messages);

    expect(mockChannel.sendToQueue).toHaveBeenCalledTimes(2);
    expect(monitoring.getMetricCount('messages_sent', { destination: 'test-queue' })).toBe(2);
    expect(monitoring.getMetricCount('batches_sent', { destination: 'test-queue', count: '2' })).toBe(1);
  });

  it('should ensure resources are cleaned up after message sending', async () => {
    mockChannel.sendToQueue.mockReturnValue(true);
    const message: Message = { id: '1', payload: {}, timestamp: new Date() };

    await service.sendMessage('test-queue', message);

    expect(mockChannel.close).toHaveBeenCalledTimes(1);
    expect(mockConnection.close).toHaveBeenCalledTimes(1);
  });

  it('should handle queue assertion failures', async () => {
    mockChannel.assertQueue.mockImplementationOnce(() => {
      throw new Error('Queue assertion failed');
    });

    await expect(
      service.sendMessage('test-queue', { id: '1', payload: {}, timestamp: new Date() })
    ).rejects.toThrow('Failed to process messages in queue "test-queue": Queue assertion failed');

    expect(monitoring.getMetricCount('connection_errors', { error: 'Queue assertion failed', batch: 'false', destination: 'test-queue' })).toBe(1);
  });
});


