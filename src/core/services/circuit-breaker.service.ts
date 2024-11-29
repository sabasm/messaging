import { injectable } from 'inversify';
import { CircuitBreakerConfig, CircuitBreakerState } from '../types/circuit-breaker.types';
import { IMonitoringService } from '../../interfaces/monitoring.interface';

@injectable()
export class CircuitBreakerService {
 private state: CircuitBreakerState;
 private readonly config: CircuitBreakerConfig;

 constructor(
   private monitoring: IMonitoringService,
   config?: Partial<CircuitBreakerConfig>
 ) {
   this.config = {
     failureThreshold: config?.failureThreshold ?? 5,
     resetTimeout: config?.resetTimeout ?? 60000,
     halfOpenSuccess: config?.halfOpenSuccess ?? 2,
     monitorInterval: config?.monitorInterval ?? 5000
   };

   this.state = {
     failures: 0,
     lastFailure: null,
     state: 'CLOSED',
     successCount: 0
   };
 }

 async execute<T>(operation: () => Promise<T>): Promise<T> {
   if (this.isOpen()) {
     throw new Error('Circuit breaker is OPEN');
   }

   try {
     const result = await operation();
     this.onSuccess();
     return result;
   } catch (error) {
     this.onFailure();
     throw error;
   }
 }

 private isOpen(): boolean {
   if (this.state.state === 'OPEN') {
     const now = new Date();
     if (this.state.lastFailure && 
         now.getTime() - this.state.lastFailure.getTime() > this.config.resetTimeout) {
       this.state.state = 'HALF_OPEN';
       this.monitoring.gauge('circuit_breaker_state', 1, { state: 'HALF_OPEN' });
       return false;
     }
     return true;
   }
   return false;
 }

 private onSuccess(): void {
   if (this.state.state === 'HALF_OPEN') {
     this.state.successCount++;
     if (this.state.successCount >= this.config.halfOpenSuccess) {
       this.state.state = 'CLOSED';
       this.state.failures = 0;
       this.state.successCount = 0;
       this.monitoring.gauge('circuit_breaker_state', 0, { state: 'CLOSED' });
     }
   }
 }

 private onFailure(): void {
   this.state.failures++;
   this.state.lastFailure = new Date();

   if (this.state.failures >= this.config.failureThreshold) {
     this.state.state = 'OPEN';
     this.monitoring.gauge('circuit_breaker_state', 2, { state: 'OPEN' });
     this.monitoring.increment('circuit_breaker_trips');
   }
 }
}


