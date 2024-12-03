import { injectable } from 'inversify';
import { BaseMiddleware } from '../base.middleware';
import { Context } from '../types';
import { MessageMetadata } from '../../types/message.types';

@injectable()
export class HeadersMiddleware extends BaseMiddleware {
  priority = 100;

  async execute(context: Context): Promise<void> {
    const metadata: MessageMetadata = context.message.metadata || {};
    metadata.headers = metadata.headers || {};
    
    Object.assign(metadata.headers, {
      'x-message-id': context.message.id,
      'x-timestamp': context.message.timestamp.toISOString(),
      'x-destination': context.destination
    });

    context.message.metadata = metadata;
  }
}


