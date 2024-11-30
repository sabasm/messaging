import { injectable, inject } from 'inversify';
import { IMessagingService } from './interfaces';
import { TYPES } from './constants';
import { Message } from './types';
import { IMonitoringService } from './interfaces/monitoring.interface';

@injectable()
export class MessagingContext {
 private strategy: IMessagingService;
 private fallbackStrategy?: IMessagingService;

 constructor(
   @inject(TYPES.MessagingService) strategy: IMessagingService,
   @inject(TYPES.FallbackMessagingService) fallbackStrategy?: IMessagingService,
   @inject(TYPES.MonitoringService) private monitoring?: IMonitoringService
 ) {
   this.strategy = strategy;
   this.fallbackStrategy = fallbackStrategy;
 }

 setStrategy(strategy: IMessagingService): void {
   this.strategy = strategy;
   this.monitoring?.increment('strategy_change');
 }

 setFallbackStrategy(fallback?: IMessagingService): void {
   this.fallbackStrategy = fallback;
   this.monitoring?.increment('fallback_strategy_change');
 }

 async sendMessage(destination: string, message: Message): Promise<void> {
   try {
     await this.strategy.sendMessage(destination, message);
     this.monitoring?.increment('message_sent', { destination });
   } catch (error) {
     this.monitoring?.increment('primary_strategy_failed', { destination });
     
     if (this.fallbackStrategy) {
       try {
         await this.fallbackStrategy.sendMessage(destination, message);
         this.monitoring?.increment('fallback_success', { destination });
       } catch {
         this.monitoring?.increment('fallback_failed', { destination });
         throw new Error('Primary and fallback strategies failed');
       }
     } else {
       throw new Error('Primary and fallback strategies failed');
     }
   }
 }

 async sendBatch(destination: string, messages: Message[]): Promise<void> {
   if (!messages.length) {
     this.monitoring?.increment('empty_batch', { destination });
     return;
   }

   try {
     await this.strategy.sendBatch(destination, messages);
     this.monitoring?.increment('batch_sent', { 
       destination,
       count: messages.length.toString() 
     });
   } catch (error) {
     this.monitoring?.increment('primary_batch_failed', { destination });

     if (this.fallbackStrategy) {
       try {
         await this.fallbackStrategy.sendBatch(destination, messages);
         this.monitoring?.increment('fallback_batch_success', { destination });
       } catch {
         this.monitoring?.increment('fallback_batch_failed', { destination });
         throw new Error('Primary and fallback strategies failed');
       }
     } else {
       throw new Error('Primary and fallback strategies failed');
     }
   }
 }
}
