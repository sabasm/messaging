import { Connection, connect, Channel } from 'amqplib';
import { injectable } from 'inversify';
import { RetryableError } from '../../core/types/retry';
import { IConnectionManager } from './interfaces';

export interface RabbitConnection {
  connection: Connection;
  channel: Channel;
}

@injectable()
export class RabbitConnectionManager implements IConnectionManager {
  private connection: RabbitConnection | null = null;
  private connecting = false;
  private connectionPromise: Promise<RabbitConnection> | null = null;

  constructor(
    private readonly url: string = 'amqp://localhost',
    private readonly options: { heartbeat?: number; prefetchCount?: number; } = {}
  ) { }

  async connect(): Promise<Connection> {
    try {
      const conn = await this.getConnection();
      return conn.connection;
    } catch (error) {
      if (error instanceof RetryableError) {
        throw error;
      }
      throw new RetryableError('Connection failed', error instanceof Error ? error : undefined);
    }
  }

  async createChannel(connection: Connection): Promise<Channel> {
    try {
      const channel = await connection.createChannel();
      if (this.options.prefetchCount) {
        await channel.prefetch(this.options.prefetchCount);
      }
      return channel;
    } catch (error) {
      throw new RetryableError(
        'Failed to create channel',
        error instanceof Error ? error : undefined
      );
    }
  }

  async getConnection(): Promise<RabbitConnection> {
    if (this.connection && this.validateConnection(this.connection)) {
      return this.connection;
    }

    if (this.connecting && this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connecting = true;
    this.connectionPromise = this.initConnection()
      .then(conn => {
        this.connection = conn;
        this.connecting = false;
        return conn;
      })
      .catch(error => {
        this.connecting = false;
        this.connectionPromise = null;
        throw error;
      });

    return this.connectionPromise;
  }

  private async initConnection(): Promise<RabbitConnection> {
    try {
      const connection = await connect(this.url, {
        heartbeat: this.options.heartbeat
      });

      const channel = await connection.createChannel();

      if (this.options.prefetchCount) {
        await channel.prefetch(this.options.prefetchCount);
      }

      this.setupEventHandlers(connection, channel);

      return { connection, channel };
    } catch (error) {
      throw new RetryableError(
        'Failed to establish RabbitMQ connection',
        error instanceof Error ? error : undefined
      );
    }
  }

  private setupEventHandlers(connection: Connection, channel: Channel): void {
    connection.on('error', this.handleDisconnect.bind(this));
    connection.on('close', this.handleDisconnect.bind(this));
    channel.on('error', this.handleDisconnect.bind(this));
    channel.on('close', this.handleDisconnect.bind(this));
  }

  private validateConnection(conn: RabbitConnection): boolean {
    try {
      return conn.connection !== null &&
        typeof conn.connection.close === 'function' &&
        conn.channel !== null;
    } catch {
      return false;
    }
  }

  private handleDisconnect(): void {
    this.connection = null;
    this.connecting = false;
    this.connectionPromise = null;
  }
}


