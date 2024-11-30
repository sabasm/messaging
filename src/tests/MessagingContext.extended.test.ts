import { MessagingContext } from '../MessagingContext';
import { Message } from '../types';
import { IMessagingService } from '../interfaces';

class ExtendedMockMessagingService implements IMessagingService {
  sendMessage = jest.fn();
  sendBatch = jest.fn();
  init = jest.fn().mockResolvedValue(undefined);
  dispose = jest.fn().mockResolvedValue(undefined);
}

describe('MessagingContext Extended Tests', () => {
  let context: MessagingContext;
  let primaryService: ExtendedMockMessagingService;
  let fallbackService: ExtendedMockMessagingService;

  beforeEach(() => {
    primaryService = new ExtendedMockMessagingService();
    fallbackService = new ExtendedMockMessagingService();
    context = new MessagingContext(primaryService, fallbackService);
    jest.clearAllMocks();
  });

  const message: Message = {
    id: '1',
    timestamp: new Date(),
    payload: { test: true }
  };

  describe('strategy management', () => {
    it('should handle undefined fallback strategy', async () => {
      context.setStrategy(primaryService);
      context.setFallbackStrategy(undefined);

      primaryService.sendMessage.mockRejectedValue(new Error('Primary failed'));

      await expect(context.sendMessage('test', message))
        .rejects
        .toThrow('Primary and fallback strategies failed');
    });

    it('should preserve strategy state during concurrent operations', async () => {
      const newStrategy = new ExtendedMockMessagingService();
      const messages = [message, { ...message, id: '2' }];

      const sendPromise = context.sendBatch('test', messages);
      context.setStrategy(newStrategy);

      await expect(sendPromise).resolves.not.toThrow();
    });
  });
});
