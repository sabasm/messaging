import { IMessagingService } from './interfaces';
import { Message } from './types';

export abstract class MessagingService implements IMessagingService {
  protected preprocessMessage(message: Message): Message {
    return {
      ...message,
      timestamp: new Date()
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected postProcessMessage(_destination: string, _message: Message): void { }

  abstract sendMessage(destination: string, message: Message): Promise<void>;
  abstract sendBatch(destination: string, messages: Message[]): Promise<void>;
}
