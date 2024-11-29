export interface CircuitBreakerConfig {
 failureThreshold: number;
 resetTimeout: number;
 halfOpenSuccess: number;
 monitorInterval: number;
}

export interface CircuitBreakerState {
 failures: number;
 lastFailure: Date | null;
 state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
 successCount: number;
}


