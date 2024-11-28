export interface RetryConfig {
 maxAttempts: number;
 delayMs: number;
 backoffFactor: number;
}

export interface RetryOptions {
 onRetry?: (error: Error, attempt: number) => void;
 shouldRetry?: (error: Error) => boolean; 
}

export class RetryableError extends Error {
 constructor(message: string, public readonly cause?: Error) {
   super(message);
   this.name = 'RetryableError';
 }
}


