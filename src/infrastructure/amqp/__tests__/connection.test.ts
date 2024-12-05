import { RabbitConnectionManager } from '../connection';
import { RetryableError } from '../../../core/types/retry';
import { Channel, Connection, connect } from 'amqplib';

jest.mock('amqplib');

interface MockChannelType extends Partial<Channel> {
  prefetch: jest.Mock;
  on: jest.Mock;
  close: jest.Mock;
}

interface MockConnectionType extends Partial<Connection> {
  createChannel: jest.Mock;
  on: jest.Mock;
  close: jest.Mock;
}

describe('RabbitConnectionManager', () => {
  let connectionManager: RabbitConnectionManager;
  let mockChannel: MockChannelType;
  let mockConnection: MockConnectionType;

  beforeEach(() => {
    mockChannel = {
      prefetch: jest.fn().mockResolvedValue(undefined),
      on: jest.fn(),
      close: jest.fn()
    };

    mockConnection = {
      createChannel: jest.fn().mockResolvedValue(mockChannel),
      on: jest.fn(),
      close: jest.fn()
    };

    (connect as jest.Mock).mockReset().mockResolvedValue(mockConnection);
    connectionManager = new RabbitConnectionManager('amqp://localhost', { prefetchCount: 10 });
  });

  describe('createChannel', () => {
    it('should handle channel creation errors', async () => {
      const error = new Error('Channel creation failed');
      const connection = await connectionManager.connect();
      mockConnection.createChannel.mockRejectedValueOnce(error);

      await expect(connectionManager.createChannel(connection))
        .rejects
        .toThrow(new RetryableError('Failed to create channel', error));
    });
  });

  describe('connect', () => {
    it('should establish connection successfully', async () => {
      const connection = await connectionManager.connect();
      expect(connect).toHaveBeenCalledWith('amqp://localhost', { heartbeat: undefined });
      expect(connection).toBe(mockConnection);
    });

    it('should handle connection errors', async () => {
      const error = new Error('Connection failed');
      (connect as jest.Mock).mockRejectedValueOnce(error);
      await expect(connectionManager.connect()).rejects.toThrow(RetryableError);
    });

    it('should reuse existing connection', async () => {
      const conn1 = await connectionManager.connect();
      const conn2 = await connectionManager.connect();
      expect(connect).toHaveBeenCalledTimes(1);
      expect(conn1).toBe(conn2);
    });
  });

  describe('connection management', () => {
    it('should handle disconnection events', async () => {
      await connectionManager.connect();
      expect(mockConnection.on).toHaveBeenCalledWith('close', expect.any(Function));

      const onCall = mockConnection.on.mock.calls.find((c: [string, unknown]) => c[0] === 'close');
      const closeHandler = onCall?.[1] as ((...args: unknown[]) => void);

      if (closeHandler) {
        closeHandler();
      }

      await connectionManager.connect();
      expect(connect).toHaveBeenCalledTimes(2);
    });

    it('should validate connection state', async () => {
      await connectionManager.connect();
      const secondConnection = await connectionManager.connect();
      expect(secondConnection.close).toBeDefined();
    });
  });
});
