import { injectable } from 'inversify';
import { Context, MiddlewareFunction, Middleware } from './types';
import { BaseConfig } from '../config/base.config';

@injectable()
export abstract class BaseMiddleware implements Middleware {
  // Priority for middleware execution
  abstract priority?: number;

  // Configuration object from BaseConfig
  protected config = BaseConfig.getInstance().getConfig();

  /**
   * Abstract method for middleware logic, must be implemented by subclasses.
   * @param context - The message processing context.
   */
  abstract execute(context: Context): Promise<void>;

  /**
   * Lifecycle hook called before the middleware executes.
   * Can be overridden for setup logic.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async onBeforeExecute(_context: Context): Promise<void> {
    // Default implementation: no-op
  }

  /**
   * Lifecycle hook called after the middleware executes.
   * Can be overridden for cleanup or monitoring logic.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async onAfterExecute(_context: Context): Promise<void> {
    // Default implementation: no-op
  }

  /**
   * Centralized error handler for middleware.
   * Can be overridden to customize error handling.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async onError(error: unknown, _context: Context): Promise<void> {
    console.error('Middleware error:', error);
    throw error;
  }

  /**
   * Main handler function used by the middleware chain.
   */
  handler: MiddlewareFunction = async (context: Context, next: () => Promise<void>) => {
    try {
      await this.onBeforeExecute(context);
      await this.execute(context);
      await this.onAfterExecute(context);
    } catch (error) {
      await this.onError(error, context);
    } finally {
      await next();
    }
  };
}
