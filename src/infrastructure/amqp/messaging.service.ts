// src/infrastructure/amqp/connection.ts
import { Connection, connect, Channel } from 'amqplib';
import { RetryableError } from '../../core/types/retry';

export interface RabbitConnection {
  connection: Connection;
  channel: Channel;
}

export class RabbitConnectionManager {
  private connection: RabbitConnection | null = null;
  private connecting = false;
  private connectionPromise: Promise<RabbitConnection> | null = null;

  constructor(
    private readonly url: string,
    private readonly options: {
      heartbeat?: number;
      prefetchCount?: number;
    } = {}
  ) { }

  async getConnection(): Promise<RabbitConnection> {
    if (this.connection && this.validateConnection(this.connection)) {
      return this.connection;
    }

    if (this.connecting && this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connecting = true;
    this.connectionPromise = this.connect()
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

  private async connect(): Promise<RabbitConnection> {
    try {
      const connection = await connect(this.url, {
        heartbeat: this.options.heartbeat
      });

      const channel = await connection.createChannel();

      if (this.options.prefetchCount) {
        await channel.prefetch(this.options.prefetchCount);
      }

      connection.on('error', this.handleDisconnect.bind(this));
      connection.on('close', this.handleDisconnect.bind(this));
      channel.on('error', this.handleDisconnect.bind(this));
      channel.on('close', this.handleDisconnect.bind(this));

      return { connection, channel };
    } catch (error) {
      throw new RetryableError(
        'Failed to establish RabbitMQ connection',
        error instanceof Error ? error : undefined
      );
    }
  }

  private validateConnection(conn: RabbitConnection): boolean {
    try {
      return conn.connection && typeof conn.connection.close === 'function';
    } catch {
      return false;
    }
  }

  private handleDisconnect(): void {
    this.connection = null;
    this.getConnection().catch(() => { });
  }
}