import { injectable } from 'inversify';
import { IMonitoringService } from '../../interfaces/monitoring.interface';

@injectable()
export class RateLimiterService {
 private readonly windowMs: number;
 private readonly maxRequests: number;
 private requests: Map<string, number[]>;

 constructor(
   private monitoring: IMonitoringService,
   windowMs = 60000,
   maxRequests = 100
 ) {
   this.windowMs = windowMs;
   this.maxRequests = maxRequests;
   this.requests = new Map();
 }

 async checkLimit(key: string): Promise<boolean> {
   const now = Date.now();
   const windowStart = now - this.windowMs;
   
   if (!this.requests.has(key)) {
     this.requests.set(key, [now]);
     return true;
   }

   const requests = this.requests.get(key)!
     .filter(timestamp => timestamp > windowStart);
   
   if (requests.length >= this.maxRequests) {
     this.monitoring.increment('rate_limit_exceeded', { key });
     return false;
   }

   requests.push(now);
   this.requests.set(key, requests);
   return true;
 }
}


