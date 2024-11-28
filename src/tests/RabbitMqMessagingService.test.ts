import 'reflect-metadata';
import { RabbitMqMessagingService } from '../RabbitMqMessagingService';
import { MockMonitoringService } from './MockMonitoringService';
import { Channel, Connection, connect } from 'amqplib';
import { Message } from '../types/message.types';

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

  afterEach(async () => {
    await service.closeConnection();
    jest.clearAllMocks();
  });

  it('should handle channel failures', async () => {
    mockChannel.sendToQueue.mockReturnValueOnce(false);
    mockChannel.sendToQueue.mockReturnValue(false);
    mockChannel.sendToQueue.mockReturnValue(false);
    await expect(service.sendMessage('test-queue', { id: '1', payload: {}, timestamp: new Date() }))
      .rejects.toThrow('Failed to send message');
    expect(mockChannel.sendToQueue).toHaveBeenCalledTimes(3);
    expect(monitoring.getMetricCount('messages_failed', { destination: 'test-queue' })).toBe(3);
  });

  it('should handle message sending retries', async () => {
    mockChannel.sendToQueue.mockReturnValueOnce(false).mockReturnValueOnce(true);
    await service.sendMessage('test-queue', { id: '1', payload: {}, timestamp: new Date() });
    expect(mockChannel.sendToQueue).toHaveBeenCalledTimes(2);
    expect(monitoring.getMetricCount('messages_failed', { destination: 'test-queue' })).toBe(1);
    expect(monitoring.getMetricCount('messages_sent', { destination: 'test-queue' })).toBe(1);
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

  it('should handle batch message sending retries', async () => {
    mockChannel.sendToQueue.mockReturnValueOnce(false).mockReturnValueOnce(true).mockReturnValueOnce(true);
    await service.sendBatch('test-queue', [
      { id: '1', payload: {}, timestamp: new Date() },
      { id: '2', payload: {}, timestamp: new Date() },
    ]);
    expect(mockChannel.sendToQueue).toHaveBeenCalledTimes(3);
    expect(monitoring.getMetricCount('messages_failed', { destination: 'test-queue', batch: 'true' })).toBe(1);
    expect(monitoring.getMetricCount('messages_sent', { destination: 'test-queue', batch: 'true' })).toBe(2);
  });

  it('should throw after max retries for sendMessage', async () => {
    mockChannel.sendToQueue.mockReturnValue(false);
    await expect(service.sendMessage('test-queue', { id: '1', payload: {}, timestamp: new Date() }))
      .rejects.toThrow('Failed to send message');
    expect(mockChannel.sendToQueue).toHaveBeenCalledTimes(3);
    expect(monitoring.getMetricCount('messages_failed', { destination: 'test-queue' })).toBe(3);
  });

  it('should throw after max retries for sendBatch', async () => {
    mockChannel.sendToQueue.mockReturnValue(false);
    await expect(service.sendBatch('test-queue', [
      { id: '1', payload: {}, timestamp: new Date() },
      { id: '2', payload: {}, timestamp: new Date() },
    ])).rejects.toThrow('Failed to send message in batch');
    expect(mockChannel.sendToQueue).toHaveBeenCalledTimes(3);
    expect(monitoring.getMetricCount('messages_failed', { destination: 'test-queue', batch: 'true' })).toBe(3);
    expect(monitoring.getMetricCount('messages_sent', { destination: 'test-queue', batch: 'true' })).toBe(0);
  });

  it('should handle connection errors', async () => {
    (connect as jest.Mock).mockRejectedValueOnce(new Error('Connection failed'));
    await expect(service.sendMessage('test-queue', { id: '1', payload: {}, timestamp: new Date() }))
      .rejects.toThrow('Connection failed');
    expect(monitoring.getMetricCount('connection_errors', { error: 'Connection failed' })).toBe(1);
  });

  it('should close connection properly after sending a message', async () => {
    mockChannel.sendToQueue.mockReturnValue(true);
    await service.sendMessage('test-queue', { id: '1', payload: {}, timestamp: new Date() });
    await service.closeConnection();
    expect(mockChannel.close).toHaveBeenCalled();
    expect(mockConnection.close).toHaveBeenCalled();
  });

  it('should close connection properly without active connection', async () => {
    await service.closeConnection();
    expect(mockChannel.close).not.toHaveBeenCalled();
    expect(mockConnection.close).not.toHaveBeenCalled();
  });
});


