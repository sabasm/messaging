import { injectable, inject } from 'inversify';
import { BaseMiddleware } from '../base.middleware';
import { Context } from '../../core/types/middleware.types';
import { TYPES } from '../../constants';
import { MessagingConfig } from '../../core/types/config.types';

@injectable()
export class BasicMiddleware extends BaseMiddleware {
 priority = 100;

 constructor(@inject(TYPES.Config) config: MessagingConfig) {
   super(config);
 }

 async execute(context: Context): Promise<void> {
   const metadata = context.message.metadata || {};
   metadata.processed = true;
   context.message.metadata = metadata;
 }
}


