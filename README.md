# Little Bunny Messaging Framework

A resilient messaging framework that seamlessly handles message delivery across different transport methods with automatic fallback capabilities.

## Features

🚀 **Multiple Transport Methods**

- RabbitMQ for robust message queuing
- HTTP APIs for RESTful messaging
- Automatic fallback when primary method fails

📊 **Built-in Monitoring**

- Message success/failure tracking
- Connection health monitoring
- Detailed metrics for debugging

🛡️ **Message Processing**

- Middleware support for message transformation
- Header injection and validation
- Extensible pipeline architecture

🛠️ **Developer Friendly**

- TypeScript-first approach
- Dependency injection ready
- Extensive test coverage (>94%)

## Installation

```bash
npm install @smendivil/little_bunny
```

## Quick Start

```typescript
import { MessagingConfigBuilder, MessagingFactory } from '@smendivil/little_bunny';

// Create configuration
const config = new MessagingConfigBuilder()
  .withApiMessaging({
    baseUrl: 'http://api.example.com',
    timeout: 5000
  })
  .withRabbitMQ({
    url: process.env.RABBITMQ_URL,
    prefetch: 10
  })
  .withFallback('rabbitmq')
  .build();

// Initialize messaging
const messaging = new MessagingFactory(config).create();

// Add middleware (optional)
messaging.useMiddleware(new HeadersMiddleware());
messaging.useMiddleware(new ValidationMiddleware());

// Send messages
await messaging.sendMessage('my-queue', {
  id: crypto.randomUUID(),
  timestamp: new Date(),
  payload: { data: 'test' }
});
```

## Configuration

### API Messaging

```typescript
withApiMessaging({
  baseUrl: string,           // API endpoint
  timeout?: number,          // Request timeout (ms)
  retryCount?: number,       // Retry attempts
  retryDelay?: number,       // Delay between retries (ms)
  healthCheck?: {
    enabled: boolean,        // Enable health checks
    interval: number         // Check interval (ms)
  }
})
```

### RabbitMQ

```typescript
withRabbitMQ({
  url: string,              // Connection URL
  prefetch?: number,        // Prefetch count
  retryCount?: number,      // Connection retries
  queues?: Record<string, string> // Queue mappings
})
```

### Middleware

```typescript
import { BaseMiddleware, Context } from '@smendivil/little_bunny';

export class CustomMiddleware extends BaseMiddleware {
  priority = 100; // Higher runs first

  async execute(context: Context): Promise<void> {
    // Modify message or metadata
    context.message.metadata = {
      ...context.message.metadata,
      processed: true
    };
  }
}
```

## Testing

```bash
# Run all tests
npm test

# Run integration tests
npm run test:integration

# Generate coverage report
npm test -- --coverage
```

Current Coverage:

- Statements: 94.57%
- Branches: 83.92%
- Functions: 93.61%
- Lines: 95.85%

## Publishing

```bash
# Create new version
npm run release [major|minor|patch]

# Publish to registry
npm publish
```

## License

ISC License
