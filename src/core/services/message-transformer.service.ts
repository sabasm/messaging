import { injectable } from 'inversify';
import { Message } from '../../types/message.types';

export type TransformFunction = (message: Message) => Promise<Message>;

@injectable()
export class MessageTransformerService {
 private transformers: TransformFunction[] = [];

 registerTransformer(transform: TransformFunction): void {
   this.transformers.push(transform);
 }

 async transform(message: Message): Promise<Message> {
   let transformedMessage = { ...message };
   
   for (const transformer of this.transformers) {
     transformedMessage = await transformer(transformedMessage);
   }
   
   return transformedMessage;
 }
}



