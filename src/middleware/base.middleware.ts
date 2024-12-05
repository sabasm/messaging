import { injectable } from 'inversify';
import { Middleware, Context, MiddlewareFunction } from '../core/types/middleware.types';
import { MessagingConfig } from '../core/types/config.types';

@injectable()
export abstract class BaseMiddleware implements Middleware {
  // Priority for middleware execution
  abstract priority?: number;

  constructor(protected readonly config?: MessagingConfig) { }

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
  async onBeforeExecute(_context: Context): Promise<void> { }

  /**
   * Lifecycle hook called after the middleware executes.
   * Can be overridden for cleanup or monitoring logic.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async onAfterExecute(_context: Context): Promise<void> { }

  /**
   * Centralized error handler for middleware.
   * Can be overridden to customize error handling.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async onError(error: unknown, _context: Context): Promise<void> {
    throw error;
  }

  protected getMonitoringPrefix(): string {
    return this.config?.monitoring?.metricsPrefix || 'default-service';
  }

  /**
 * Main handler function used by the middleware chain.
 */
  handler: MiddlewareFunction = async (context: Context, next: () => Promise<void>) => {
    try {
      await this.onBeforeExecute(context);
      await this.execute(context);
      await this.onAfterExecute(context);
      await next();
    } catch (error) {
      await this.onError(error, context);
    }
  };
}
