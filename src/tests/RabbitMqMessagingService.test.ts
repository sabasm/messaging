import 'reflect-metadata';
import { RabbitMqMessagingService } from '../RabbitMqMessagingService';
import { MockMonitoringService } from './MockMonitoringService';
import { Channel, Connection } from 'amqplib';
import { Message } from '../types/message.types';
import { IConnectionManager } from '../infrastructure/amqp/IConnectionManager';

jest.mock('../infrastructure/amqp/IConnectionManager');

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
    ).rejects.toThrow('Connection failed');

    expect(monitoring.getMetricCount('connection_errors', { error: 'Connection failed' })).toBe(1);
    expect(mockChannel.sendToQueue).not.toHaveBeenCalled();
  });

  it('should handle batch message sending', async () => {
    mockChannel.sendToQueue.mockReturnValue(true);
    await service.sendBatch('test-queue', [
      { id: '1', payload: {}, timestamp: new Date() },
      { id: '2', payload: {}, timestamp: new Date() },
    ]);
    expect(mockChannel.sendToQueue).toHaveBeenCalledTimes(2);
    expect(monitoring.getMetricCount('messages_sent', { destination: 'test-queue', batch: 'true' })).toBe(2);
  });
})
