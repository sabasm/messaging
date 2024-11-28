import { injectable, inject } from 'inversify';
import { MessagingService } from './MessagingService';
import { Message } from './types/message.types';
import { IMonitoringService } from './interfaces';
import { TYPES } from './constants';
import { IConnectionManager } from './infrastructure/amqp/IConnectionManager';
import { QUEUE_OPTIONS } from './config/queue.config';
import { Channel, Connection } from 'amqplib';

@injectable()
export class RabbitMqMessagingService extends MessagingService {
  constructor(
    @inject(TYPES.MonitoringService) private monitoring: IMonitoringService,
    @inject(TYPES.ConnectionManager) private connectionManager: IConnectionManager
  ) {
    super();
  }

  async sendMessage(queue: string, message: Message): Promise<void> {
    await this.processMessage(queue, [message], false);
  }

  async sendBatch(queue: string, messages: Message[]): Promise<void> {
    await this.processMessage(queue, messages, true);
  }

  private async processMessage(queue: string, messages: Message[], isBatch: boolean): Promise<void> {
    let connection: Connection | null = null;
    let channel: Channel | null = null;

    try {
      connection = await this.connectionManager.connect();
      channel = await this.connectionManager.createChannel(connection);
      await channel.assertQueue(queue, QUEUE_OPTIONS);

      for (const message of messages) {
        channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)));
        this.monitoring.increment('messages_sent', { destination: queue });
      }

      if (isBatch) {
        this.monitoring.increment('batches_sent', { destination: queue, count: `${messages.length}` });
      }
    } catch (error: unknown) {
      let errorMessage = 'Unknown Error';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      this.monitoring.increment('connection_errors', {
        error: errorMessage,
        batch: isBatch ? 'true' : 'false',
        destination: queue,
      });
      throw new Error(`Failed to process messages in queue "${queue}": ${errorMessage}`);
    } finally {
      if (channel) await channel.close();
      if (connection) await connection.close();
    }
  }
}


