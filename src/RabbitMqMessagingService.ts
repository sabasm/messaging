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
  private isInitialized = false;

  constructor(
    @inject(TYPES.MonitoringService) private monitoring: IMonitoringService,
    @inject(TYPES.ConnectionManager) private connectionManager: IConnectionManager
  ) {
    super();
  }

  async init(): Promise<void> {
    if (this.isInitialized) return;
    this.monitoring.increment('rabbitmq_initialized', { state: 'init' });
    this.isInitialized = true;
  }

  async dispose(): Promise<void> {
    if (!this.isInitialized) return;
    this.monitoring.increment('rabbitmq_disposed', { state: 'disposed' });
    this.isInitialized = false;
  }

  async sendMessage(queue: string, message: Message): Promise<void> {
    if (!this.isInitialized) {
      await this.init();
    }
    await this.processMessages(queue, [message], false);
  }

  async sendBatch(queue: string, messages: Message[]): Promise<void> {
    if (!this.isInitialized) {
      await this.init();
    }
    await this.processMessages(queue, messages, true);
  }

  private async processMessages(queue: string, messages: Message[], isBatch: boolean): Promise<void> {
    let connection: Connection | null = null;
    let channel: Channel | null = null;
    const labels = { destination: queue, batch: String(isBatch) };

    try {
      connection = await this.connectionManager.connect();
      channel = await this.connectionManager.createChannel(connection);
      
      await channel.assertQueue(queue, QUEUE_OPTIONS);
      this.monitoring.increment('connection_success', labels);

      for (const message of messages) {
        try {
          const messageBuffer = Buffer.from(JSON.stringify(message));
          const sent = channel.sendToQueue(queue, messageBuffer);
          if (sent) {
            this.monitoring.increment('messages_sent', labels);
          }
        } catch (error) {
          this.monitoring.increment('message_processing_errors', labels);
          throw error;
        }
      }

      if (isBatch) {
        this.monitoring.increment('batches_sent', { ...labels, count: String(messages.length) });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.monitoring.increment('connection_errors', { ...labels, error: errorMessage });
      throw new Error(`Failed to process messages in queue "${queue}": ${errorMessage}`);
    } finally {
      if (channel) await channel.close();
      if (connection) await connection.close();
    }
  }
}


