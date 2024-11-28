import { RetryConfig, RetryOptions } from '../types/retry';

export async function withRetry<T>(
 operation: () => Promise<T>,
 config: RetryConfig,
 options?: RetryOptions
): Promise<T> {
 let lastError: Error | undefined;

 for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
   try {
     return await operation();
   } catch (error) {
     lastError = error instanceof Error ? error : new Error(String(error));
     
     if (options?.shouldRetry && !options.shouldRetry(lastError)) {
       throw lastError;
     }

     if (attempt === config.maxAttempts) {
       throw lastError;
     }

     options?.onRetry?.(lastError, attempt);
     
     const delay = config.delayMs * Math.pow(config.backoffFactor, attempt - 1);
     await new Promise(resolve => setTimeout(resolve, delay));
   }
 }

 throw lastError;
}


