import 'reflect-metadata';
import { MessagingContext } from '../MessagingContext';
import { Message } from '../types';
import { IMessagingService } from '../interfaces';

class MockMessagingService implements IMessagingService {
  sendMessage = jest.fn();
  sendBatch = jest.fn();
}

describe('MessagingContext', () => {
  let context: MessagingContext;
  let primaryService: MockMessagingService;
  let fallbackService: MockMessagingService;

  beforeEach(() => {
    primaryService = new MockMessagingService();
    fallbackService = new MockMessagingService();
    context = new MessagingContext(primaryService, fallbackService);
    jest.clearAllMocks();
  });

  const message: Message = {
    id: '1',
    timestamp: new Date(),
    payload: { data: 'test' }
  };

  describe('sendMessage', () => {
    it('should use primary service successfully', async () => {
      primaryService.sendMessage.mockResolvedValue(undefined);
      await context.sendMessage('test-destination', message);
      expect(primaryService.sendMessage).toHaveBeenCalledWith('test-destination', message);
      expect(fallbackService.sendMessage).not.toHaveBeenCalled();
    });

    it('should use fallback service when primary fails', async () => {
      primaryService.sendMessage.mockRejectedValue(new Error('Primary failed'));
      fallbackService.sendMessage.mockResolvedValue(undefined);
      await context.sendMessage('test-destination', message);
      expect(primaryService.sendMessage).toHaveBeenCalled();
      expect(fallbackService.sendMessage).toHaveBeenCalledWith('test-destination', message);
    });

    it('should throw when both services fail', async () => {
      primaryService.sendMessage.mockRejectedValue(new Error('Primary failed'));
      fallbackService.sendMessage.mockRejectedValue(new Error('Fallback failed'));
      await expect(context.sendMessage('test-destination', message))
        .rejects
        .toThrow('Primary and fallback strategies failed');
    });

    it('should handle undefined fallback strategy', async () => {
      context = new MessagingContext(primaryService);
      primaryService.sendMessage.mockRejectedValue(new Error('Primary failed'));
      await expect(context.sendMessage('test-destination', message))
        .rejects
        .toThrow('Primary and fallback strategies failed');
    });
  });

  describe('sendBatch', () => {
    const messages = [message, { ...message, id: '2' }];

    it('should use primary service successfully', async () => {
      primaryService.sendBatch.mockResolvedValue(undefined);
      await context.sendBatch('test-destination', messages);
      expect(primaryService.sendBatch).toHaveBeenCalledWith('test-destination', messages);
      expect(fallbackService.sendBatch).not.toHaveBeenCalled();
    });

    it('should use fallback service when primary fails', async () => {
      primaryService.sendBatch.mockRejectedValue(new Error('Primary failed'));
      fallbackService.sendBatch.mockResolvedValue(undefined);
      await context.sendBatch('test-destination', messages);
      expect(primaryService.sendBatch).toHaveBeenCalled();
      expect(fallbackService.sendBatch).toHaveBeenCalledWith('test-destination', messages);
    });

    it('should throw when both services fail for batch', async () => {
      primaryService.sendBatch.mockRejectedValue(new Error('Primary failed'));
      fallbackService.sendBatch.mockRejectedValue(new Error('Fallback failed'));
      await expect(context.sendBatch('test-destination', messages))
        .rejects
        .toThrow('Primary and fallback strategies failed');
    });

    it('should handle undefined fallback strategy for batch', async () => {
      context = new MessagingContext(primaryService);
      primaryService.sendBatch.mockRejectedValue(new Error('Primary failed'));
      await expect(context.sendBatch('test-destination', messages))
        .rejects
        .toThrow('Primary and fallback strategies failed');
    });
  });

  describe('strategy management', () => {
    it('should allow changing primary strategy', async () => {
      const newStrategy = new MockMessagingService();
      context.setStrategy(newStrategy);
      await context.sendMessage('test', message);
      expect(newStrategy.sendMessage).toHaveBeenCalled();
      expect(primaryService.sendMessage).not.toHaveBeenCalled();
    });

    it('should allow changing fallback strategy', async () => {
      const newFallback = new MockMessagingService();
      context.setFallbackStrategy(newFallback);
      primaryService.sendMessage.mockRejectedValue(new Error());
      await context.sendMessage('test', message);
      expect(newFallback.sendMessage).toHaveBeenCalled();
      expect(fallbackService.sendMessage).not.toHaveBeenCalled();
    });
  });
});


