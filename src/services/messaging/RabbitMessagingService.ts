import { injectable, inject } from 'inversify';
import { BaseMessagingService } from '../base/BaseMessagingService';
import { Message } from '../../types';
import { IMonitoringService } from '../../interfaces';
import { TYPES } from '../../constants';
import { IConnectionManager } from '../../infrastructure/amqp/IConnectionManager';
import { QUEUE_OPTIONS } from '../../config/queue.config';
import { Channel, Connection } from 'amqplib';

@injectable()
export class RabbitMessagingService extends BaseMessagingService {
  constructor(
    @inject(TYPES.MonitoringService) monitoring: IMonitoringService,
    @inject(TYPES.ConnectionManager) private connectionManager: IConnectionManager
  ) {
    super(monitoring);
  }

  protected getServiceName(): string {
    return 'rabbitmq';
  }

  async sendMessage(queue: string, message: Message): Promise<void> {
    await this.initialize();
    await this.processMessages(queue, [message], false);
  }

  async sendBatch(queue: string, messages: Message[]): Promise<void> {
    await this.initialize();
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

      for (const message of messages) {
        const messageBuffer = Buffer.from(JSON.stringify(message));
        channel.sendToQueue(queue, messageBuffer);
        this.monitoring.increment('messages_sent', labels);
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


