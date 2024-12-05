import { Context } from '../../core/types/middleware.types';
import { CustomHeadersMiddleware } from '../../middleware/custom-headers.middleware'; 
import { MessagingConfig } from '../../core/types/config.types';
import { DEFAULT_CONFIG } from '../../config/messaging.config';

describe('CustomHeadersMiddleware', () => {
  let middleware: CustomHeadersMiddleware;
  let context: Context;

  beforeEach(() => {
    const config: MessagingConfig = {
      ...DEFAULT_CONFIG,
      monitoring: {
        ...DEFAULT_CONFIG.monitoring,
        metricsPrefix: 'test-service'
      }
    };
    
    middleware = new CustomHeadersMiddleware(config);
    context = {
      destination: 'test-queue',
      message: {
        id: '1',
        timestamp: new Date(),
        payload: {},
        metadata: { headers: {} }
      },
      metadata: {}
    };
  });

  it('should add custom headers to message', async () => {
    await middleware.handler(context, jest.fn());

    expect(context.message.metadata?.headers).toMatchObject({
      'x-service-name': 'test-service',
      'x-request-id': expect.any(String),
      'x-timestamp': expect.any(String),
      'x-environment': expect.any(String)
    });
  });
});


