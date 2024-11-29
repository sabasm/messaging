import { Message } from '../types/message.types';

export interface IMessagingService {
 init(): Promise<void>;
 dispose(): Promise<void>;
 sendMessage(destination: string, message: Message): Promise<void>;
 sendBatch(destination: string, messages: Message[]): Promise<void>;
}


