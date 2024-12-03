import { MiddlewareChain } from '../../middleware/implementation/middleware-chain';
import { Context, Middleware } from '../../middleware/types';
import { MessageMetadata } from '../../types/message.types';

describe('MiddlewareChain', () => {
  let chain: MiddlewareChain;
  let context: Context;
  let orders: number[];

  beforeEach(() => {
    chain = new MiddlewareChain();
    orders = [];
    context = {
      destination: 'test',
      message: {
        id: '1',
        timestamp: new Date(),
        payload: {},
        metadata: { headers: {} }
      },
      metadata: {}
    };
  });

  const createMiddleware = (priority: number): Middleware => ({
    priority,
    handler: async (ctx, next): Promise<void> => {
      orders.push(priority);
      await next();
    }
  });

  it('should execute middleware in priority order', async () => {
    chain.add(createMiddleware(1));
    chain.add(createMiddleware(3));
    chain.add(createMiddleware(2));

    await chain.execute(context);

    expect(orders).toEqual([3, 2, 1]);
  });

  it('should allow middleware to modify context', async () => {
    const middleware: Middleware = {
      handler: async (ctx, next): Promise<void> => {
        const metadata: MessageMetadata = ctx.message.metadata || {};
        metadata.test = true;
        ctx.message.metadata = metadata;
        await next();
      }
    };

    chain.add(middleware);
    await chain.execute(context);

    expect(context.message.metadata?.test).toBe(true);
  });
});
