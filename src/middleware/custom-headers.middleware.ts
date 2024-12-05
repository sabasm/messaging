import { injectable } from 'inversify';
import { BaseMiddleware } from './base.middleware';
import { Context } from './types';

@injectable()
export class CustomHeadersMiddleware extends BaseMiddleware {
  priority = 100;

  async execute(context: Context): Promise<void> {
    const headers = context.message.metadata?.headers || {};
    const environment = process.env.NODE_ENV || 'development';

    // Dynamically populate headers
    Object.assign(headers, {
      'x-service-name': this.config.monitoring.metricsPrefix || 'default-service',
      'x-request-id': Math.random().toString(36).substring(2),
      'x-timestamp': new Date().toISOString(),
      'x-environment': environment,
    });

    context.message.metadata = { ...context.message.metadata, headers };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async onBeforeExecute(_context: Context): Promise<void> {
    console.log('Preparing to add custom headers...');
  }

  async onAfterExecute(context: Context): Promise<void> {
    console.log('Custom headers successfully added:', context.message.metadata?.headers);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async onError(error: unknown, _context: Context): Promise<void> {
    console.error('Error adding custom headers:', error);
    // Optionally perform fallback actions or logging
    throw error;
  }
}
