import { injectable, inject } from 'inversify';
import { connect, Connection, Channel } from 'amqplib';
import { MessagingService } from './MessagingService';
import { Message } from './types/message.types';
import { IMonitoringService } from './interfaces/monitoring.interface';
import { TYPES } from './constants';
import { QUEUE_OPTIONS } from './config/queue.config';

@injectable()
export class RabbitMqMessagingService extends MessagingService {
  private connection: Connection | null = null;
  private channel: Channel | null = null;
  private connecting = false;

  constructor(
    @inject(TYPES.MonitoringService) private monitoring: IMonitoringService
  ) {
    super();
  }

  private async connect(): Promise<void> {
    if (this.connecting || (this.channel && this.connection)) return;
    this.connecting = true;
    try {
      this.connection = await connect('amqp://localhost');
      this.channel = await this.connection.createChannel();
      this.channel.on('close', () => (this.channel = null));
      this.connection.on('close', () => (this.connection = null));
    } catch (err) {
      const error = err as Error;
      this.monitoring.increment('connection_errors', { error: error.message });
      this.cleanup();
      throw error;
    } finally {
      this.connecting = false;
    }
  }

  private cleanup(): void {
    this.channel = null;
    this.connection = null;
  }

  async sendMessage(queue: string, message: Message): Promise<void> {
    await this.attemptOperation(async () => {
      if (!this.channel) {
        await this.connect();
      }
      if (!this.channel) {
        throw new Error('Channel not available');
      }
      await this.channel.assertQueue(queue, QUEUE_OPTIONS);
      const sent = this.channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)));
      if (!sent) {
        this.monitoring.increment('messages_failed', { destination: queue });
        throw new Error('Failed to send message');
      }
      this.monitoring.increment('messages_sent', { destination: queue });
    });
  }

  async sendBatch(queue: string, messages: Message[]): Promise<void> {
    await this.attemptOperation(async () => {
      if (!this.channel) {
        await this.connect();
      }
      if (!this.channel) {
        throw new Error('Channel not available');
      }
      await this.channel.assertQueue(queue, QUEUE_OPTIONS);
      for (const message of messages) {
        const sent = this.channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)));
        if (!sent) {
          this.monitoring.increment('messages_failed', { destination: queue, batch: 'true' });
          throw new Error('Failed to send message in batch');
        }
      }
      this.monitoring.increment('messages_sent', { destination: queue, batch: 'true' });
    });
  }

  private async attemptOperation(operation: () => Promise<void>, retries = 3): Promise<void> {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        await operation();
        return;
      } catch (err) {
        if (attempt === retries - 1) {
          throw err;
        }
        await new Promise((res) => setTimeout(res, 1000));
      }
    }
  }

  public async closeConnection(): Promise<void> {
    if (this.channel) {
      await this.channel.close();
      this.channel = null;
    }
    if (this.connection) {
      await this.connection.close();
      this.connection = null;
    }
  }
}


