import { injectable, inject } from 'inversify';
import { MessagingService } from './MessagingService';
import { Message } from './types/message.types';
import { IMonitoringService } from './interfaces';
import { TYPES } from './constants';
import { IConnectionManager } from './infrastructure/amqp/IConnectionManager';
import { QUEUE_OPTIONS } from './config/queue.config';

@injectable()
export class RabbitMqMessagingService extends MessagingService {
  private connectionManager: IConnectionManager;

  constructor(
    @inject(TYPES.MonitoringService) private monitoring: IMonitoringService,
    @inject(TYPES.ConnectionManager) connectionManager: IConnectionManager
  ) {
    super();
    this.connectionManager = connectionManager;
  }

  async sendMessage(queue: string, message: Message): Promise<void> {
    const connection = await this.connectionManager.connect();
    const channel = await this.connectionManager.createChannel(connection);
    try {
      await channel.assertQueue(queue, QUEUE_OPTIONS);
      channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)));
      this.monitoring.increment('messages_sent', { destination: queue });
    } finally {
      await channel.close();
      await connection.close();
    }
  }

  async sendBatch(queue: string, messages: Message[]): Promise<void> {
    const connection = await this.connectionManager.connect();
    const channel = await this.connectionManager.createChannel(connection);
    try {
      await channel.assertQueue(queue, QUEUE_OPTIONS);
      for (const message of messages) {
        channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)));
      }
      this.monitoring.increment('messages_sent', { destination: queue, batch: 'true' });
    } finally {
      await channel.close();
      await connection.close();
    }
  }
}


