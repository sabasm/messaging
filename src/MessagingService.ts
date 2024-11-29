import { Message } from './types/message.types';
import { IMessagingService } from './interfaces';

export abstract class MessagingService implements IMessagingService {
 protected preprocessMessage(message: Message): Message {
   return {
     ...message,
     timestamp: new Date()
   };
 }

 abstract init(): Promise<void>;
 abstract dispose(): Promise<void>;
 abstract sendMessage(destination: string, message: Message): Promise<void>;
 abstract sendBatch(destination: string, messages: Message[]): Promise<void>;
}


