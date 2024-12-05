import { injectable, inject } from 'inversify';
import { BaseMiddleware } from './base.middleware';
import { Context } from '../core/types/middleware.types';
import { TYPES } from '../constants';
import { MessagingConfig } from '../core/types/config.types';

@injectable()
export class CustomHeadersMiddleware extends BaseMiddleware {
 priority = 100;

 constructor(@inject(TYPES.Config) config: MessagingConfig) {
   super(config);
 }

 async execute(context: Context): Promise<void> {
   const headers = context.message.metadata?.headers || {};
   const environment = process.env.NODE_ENV || 'development';

   Object.assign(headers, {
     'x-service-name': this.getMonitoringPrefix(),
     'x-request-id': Math.random().toString(36).substring(2),
     'x-timestamp': new Date().toISOString(),
     'x-environment': environment,
   });

   context.message.metadata = { ...context.message.metadata, headers };
 }
}


