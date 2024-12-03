import { injectable } from 'inversify';
import { Context, MiddlewareFunction, Middleware } from './types';

@injectable()
export abstract class BaseMiddleware implements Middleware {
  abstract priority?: number;
  abstract execute(context: Context): Promise<void>;

  handler: MiddlewareFunction = async (context: Context, next: () => Promise<void>) => {
    await this.execute(context);
    await next();
  };
}


