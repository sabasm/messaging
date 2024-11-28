import { Message } from '../types/messaging';

export abstract class MessagingService {
 abstract publish(destination: string, message: Message): Promise<void>;
 abstract publishBatch(destination: string, messages: Message[]): Promise<void>;
 
 protected formatMessage(message: Message): Message {
   return {
     ...message,
     timestamp: new Date()
   };
 }
}


