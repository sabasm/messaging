import 'reflect-metadata';
import { MessagingContext } from '../MessagingContext';
import { Message, MessageMetadata } from '../types/message.types';
import { IMessagingService } from '../interfaces';

class MockMessagingService implements IMessagingService {
  sendMessage = jest.fn();
  sendBatch = jest.fn();
  init = jest.fn().mockResolvedValue(undefined);
  dispose = jest.fn().mockResolvedValue(undefined);
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

  const metadata: MessageMetadata = {
    headers: {},
    priority: 0,
    delay: 0
  };

  const message: Message = {
    id: '1',
    timestamp: new Date(),
    payload: { data: 'test' },
    metadata
  };

  describe('sendMessage', () => {
    it('should use primary service successfully', async () => {
      primaryService.sendMessage.mockResolvedValue(undefined);
      await context.sendMessage('test-destination', message);
      expect(primaryService.sendMessage).toHaveBeenCalledWith('test-destination', expect.objectContaining({
        id: message.id,
        metadata: expect.objectContaining({ headers: {} })
      }));
      expect(fallbackService.sendMessage).not.toHaveBeenCalled();
    });

    it('should use fallback service when primary fails', async () => {
      primaryService.sendMessage.mockRejectedValue(new Error('Primary failed'));
      fallbackService.sendMessage.mockResolvedValue(undefined);
      await context.sendMessage('test-destination', message);
      expect(primaryService.sendMessage).toHaveBeenCalled();
      expect(fallbackService.sendMessage).toHaveBeenCalledWith('test-destination', expect.objectContaining({
        id: message.id,
        metadata: expect.objectContaining({ headers: {} })
      }));
    });

    it('should throw when both services fail', async () => {
      primaryService.sendMessage.mockRejectedValue(new Error('Primary failed'));
      fallbackService.sendMessage.mockRejectedValue(new Error('Fallback failed'));
      await expect(context.sendMessage('test-destination', message))
        .rejects
        .toThrow('Primary and fallback strategies failed');
    });

    it('should throw when no fallback is configured', async () => {
      context = new MessagingContext(primaryService);
      primaryService.sendMessage.mockRejectedValue(new Error('Primary failed'));
      await expect(context.sendMessage('test-destination', message))
        .rejects
        .toThrow('No fallback strategy configured');
    });
  });

  describe('strategy management', () => {
    it('should throw when setting null strategy', () => {
      expect(() => context.setStrategy(null as unknown as IMessagingService))
        .toThrow('Strategy cannot be null or undefined');
    });

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

  describe('lifecycle methods', () => {
    it('should initialize both services', async () => {
      await context.init();
      expect(primaryService.init).toHaveBeenCalled();
      expect(fallbackService.init).toHaveBeenCalled();
    });

    it('should dispose both services', async () => {
      await context.dispose();
      expect(primaryService.dispose).toHaveBeenCalled();
      expect(fallbackService.dispose).toHaveBeenCalled();
    });
  });
});
