import { container } from '../../container';
import { TYPES } from '../../constants';
import { MessagingContext } from '../../MessagingContext';
import { Message } from '../../types/message.types';
import * as amqp from 'amqplib';

describe('Messaging Integration', () => {
  let messagingContext: MessagingContext;

  beforeAll(async () => {
    const connection = await amqp.connect('amqp://localhost');
    const channel = await connection.createChannel();
    await channel.deleteQueue('test-destination');
    await channel.close();
    await connection.close();
  });

  beforeEach(() => {
    messagingContext = container.get<MessagingContext>(TYPES.MessagingContext);
  });

  const message: Message = {
    id: 'test-1',
    timestamp: new Date(),
    payload: { test: 'data' }
  };

  it('should send message through the entire pipeline', async () => {
    await expect(messagingContext.sendMessage('test-destination', message))
      .resolves
      .not.toThrow();
  });

  it('should send batch through the entire pipeline', async () => {
    const messages = [message, { ...message, id: 'test-2' }];
    await expect(messagingContext.sendBatch('test-destination', messages))
      .resolves
      .not.toThrow();
  });
})
