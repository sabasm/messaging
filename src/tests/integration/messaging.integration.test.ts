import { container } from '../../container';
import { TYPES } from '../../constants';
import { MessagingContext } from '../../MessagingContext';
import { Message } from '../../types';

describe('Messaging Integration', () => {
  let messagingContext: MessagingContext;

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
});

