import { injectable, inject } from 'inversify';
import * as amqp from 'amqplib';
import { MessagingService } from './MessagingService';
import { Message } from './types';
import { IMonitoringService } from './interfaces';
import { TYPES } from './constants';

@injectable()
export class RabbitMqMessagingService extends MessagingService {
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;
  private retryCount = 3;
  private queueOptions = {
    durable: true,
    arguments: { 'x-max-priority': 10 }
  };

  constructor(
    @inject(TYPES.MonitoringService) private monitoring: IMonitoringService
  ) {
    super();
  }

  private async connect(): Promise<void> {
    try {
      if (!this.connection) {
        this.connection = await amqp.connect('amqp://localhost');
        this.connection.on('error', () => {
          this.connection = null;
          this.channel = null;
        });
      }
      if (!this.channel) {
        this.channel = await this.connection.createChannel();
      }
    } catch (error) {
      this.connection = null;
      this.channel = null;
      throw error;
    }
  }

  public async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async sendMessage(queue: string, message: Message): Promise<void> {
    await this.connect();
    if (!this.channel) throw new Error('Failed to create channel');

    await this.channel.assertQueue(queue, this.queueOptions);
    const processedMessage = this.preprocessMessage(message);
    const msgBuffer = Buffer.from(JSON.stringify(processedMessage));
    const options = {
      priority: processedMessage.metadata?.priority,
      headers: { 'x-delay': processedMessage.metadata?.delay }
    };

    for (let attempt = 1; attempt <= this.retryCount; attempt++) {
      try {
        const result = this.channel.sendToQueue(queue, msgBuffer, options);
        if (result) {
          this.monitoring.increment('messages_sent', { destination: queue });
          return;
        }
        throw new Error('Failed to send message');
      } catch (error) {
        this.monitoring.increment('messages_failed', { destination: queue });
        if (attempt === this.retryCount) {
          throw error;
        }
        await this.delay(attempt * 1000);
      }
    }
  }

  async sendBatch(queue: string, messages: Message[]): Promise<void> {
    await this.connect();
    if (!this.channel) throw new Error('Failed to create channel');

    await this.channel.assertQueue(queue, this.queueOptions);

    for (const message of messages) {
      const processedMessage = this.preprocessMessage(message);
      const msgBuffer = Buffer.from(JSON.stringify(processedMessage));
      const options = {
        priority: processedMessage.metadata?.priority,
        headers: { 'x-delay': processedMessage.metadata?.delay }
      };

      for (let attempt = 1; attempt <= this.retryCount; attempt++) {
        try {
          const result = this.channel.sendToQueue(queue, msgBuffer, options);
          if (result) {
            this.monitoring.increment('messages_sent', { destination: queue, batch: 'true' });
            break;
          }
          throw new Error('Failed to send message');
        } catch (error) {
          this.monitoring.increment('messages_failed', { destination: queue, batch: 'true' });
          if (attempt === this.retryCount) {
            throw error;
          }
          await this.delay(attempt * 1000);
        }
      }
    }
  }

  async close(): Promise<void> {
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


