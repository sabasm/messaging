import { injectable } from 'inversify';
import { BaseMiddleware } from '../base.middleware';
import { Context } from '../types';
import { messageSchema } from '../../config/validation';

@injectable()
export class ValidationMiddleware extends BaseMiddleware {
  priority = 300;

  async execute(context: Context): Promise<void> {
    const result = messageSchema.safeParse(context.message);
    if (!result.success) {
      throw new Error(`Message validation failed: ${result.error.message}`);
    }
  }
}


