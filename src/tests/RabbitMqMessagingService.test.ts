import 'reflect-metadata';
import { RabbitMqMessagingService } from '../RabbitMqMessagingService';
import { MockMonitoringService } from './MockMonitoringService';
import { Channel, Connection, connect } from 'amqplib';

jest.mock('amqplib');

describe('RabbitMqMessagingService', () => {
  let service: RabbitMqMessagingService;
  let monitoring: MockMonitoringService;
  let mockChannel: jest.Mocked<Channel>;
  let mockConnection: jest.Mocked<Connection>;

  beforeEach(() => {
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

    (connect as jest.Mock).mockResolvedValue(mockConnection);

    monitoring = new MockMonitoringService();
    service = new RabbitMqMessagingService(monitoring);
  });

  afterEach(() => {
    service['cleanup']();
  });

  it('should handle channel failures', async () => {
    mockChannel.sendToQueue.mockReturnValueOnce(false);
    await expect(service.sendMessage('test-queue', { id: '1', payload: {}, timestamp: new Date() }))
      .rejects.toThrow('Failed to send message');
    expect(mockChannel.sendToQueue).toHaveBeenCalled();
  });

  it('should handle message sending retries', async () => {
    mockChannel.sendToQueue.mockReturnValueOnce(false).mockReturnValueOnce(true);
    await service.sendMessage('test-queue', { id: '1', payload: {}, timestamp: new Date() });
    expect(mockChannel.sendToQueue).toHaveBeenCalledTimes(2);
  });

  it('should handle batch message sending', async () => {
    mockChannel.sendToQueue.mockReturnValue(true);
    await service.sendBatch('test-queue', [
      { id: '1', payload: {}, timestamp: new Date() },
      { id: '2', payload: {}, timestamp: new Date() },
    ]);
    expect(mockChannel.sendToQueue).toHaveBeenCalledTimes(2);
  });
});


