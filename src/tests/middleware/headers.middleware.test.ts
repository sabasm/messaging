import { BaseConfig } from "../../config";
import { CustomHeadersMiddleware } from "../../middleware/custom-headers.middleware";
import { Context } from "../../types";


describe('CustomHeadersMiddleware', () => {
  let middleware: CustomHeadersMiddleware;
  let context: Context;

  beforeEach(() => {
    BaseConfig.clearInstance(); // Ensure config is reset for each test
    middleware = new CustomHeadersMiddleware();
    context = {
      destination: 'test-queue',
      message: {
        id: '1',
        timestamp: new Date(),
        payload: {},
        metadata: { headers: {} },
      },
      metadata: {},
    };
  });

  it('should add custom headers to the message', async () => {
    const next = jest.fn();
    await middleware.handler(context, next);

    expect(context.message.metadata?.headers).toMatchObject({
      'x-service-name': 'messaging',
      'x-request-id': expect.any(String),
      'x-timestamp': expect.any(String),
      'x-environment': expect.any(String),
    });

    expect(next).toHaveBeenCalled();
  });
});
