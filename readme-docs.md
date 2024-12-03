# Little Bunny Messaging Framework

A resilient messaging framework that seamlessly handles message delivery across different transport methods with automatic fallback capabilities.

## What's This?

This is your go-to messaging framework when you need reliable message delivery with built-in fallback strategies. Whether you're using RabbitMQ, REST APIs, or both, we've got you covered.

## Core Features

🚀 **Multiple Transport Methods**
- RabbitMQ for robust message queuing
- HTTP APIs for RESTful messaging
- Automatic fallback when primary method fails

📊 **Built-in Monitoring**
- Message success/failure tracking
- Connection health monitoring
- Detailed metrics for debugging

🛠️ **Developer Friendly**
- TypeScript-first approach
- Dependency injection ready
- Extensive test coverage

## Quick Start

1. Install the package:
```bash
npm install @smendivil/little_bunny
```

2. Set up your messaging service:
```typescript
import { MessagingConfigBuilder, MessagingFactory } from '@smendivil/little_bunny';

// Create your configuration
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

// Initialize the service
const messaging = new MessagingFactory(config).create();
```

3. Start sending messages:
```typescript
// Send a single message
await messaging.sendMessage('my-queue', {
  id: crypto.randomUUID(),
  timestamp: new Date(),
  payload: { hello: 'world' }
});

// Send multiple messages
await messaging.sendBatch('my-queue', messages);
```

## Configuration Options

### API Messaging
```typescript
withApiMessaging({
  baseUrl: 'http://api.example.com',      // Your API endpoint
  timeout: 5000,                          // Request timeout (ms)
  retryCount: 3,                          // Number of retry attempts
  healthCheck: {
    enabled: true,                        // Enable health checking
    interval: 30000                       // Check every 30 seconds
  }
})
```

### RabbitMQ
```typescript
withRabbitMQ({
  url: 'amqp://localhost',                // RabbitMQ connection URL
  prefetch: 10,                           // Prefetch message count
  retryCount: 3,                          // Connection retry attempts
  queues: {                               // Queue definitions
    'my-queue': 'my-queue-dlx'
  }
})
```

## Testing

We maintain high test coverage to ensure reliability:
- Unit tests: `npm test`
- Coverage report: `npm test -- --coverage`
- Integration tests: `npm run test:integration`

Current Coverage:
- Statements: 93.68%
- Branches: 83.33%
- Functions: 94.59%
- Lines: 95.20%

## Express Integration Example

Here's a real-world example of using the framework in an Express app:

```typescript
import express from 'express';
import { MessagingConfigBuilder, MessagingFactory } from '@smendivil/little_bunny';

async function startServer() {
  const app = express();
  
  // Initialize messaging
  const messaging = new MessagingFactory(
    new MessagingConfigBuilder()
      .withApiMessaging({
        baseUrl: process.env.API_URL
      })
      .withRabbitMQ({
        url: process.env.RABBITMQ_URL
      })
      .withFallback('rabbitmq')
      .build()
  ).create();

  // Message sending endpoint
  app.post('/messages/:queue', async (req, res) => {
    try {
      await messaging.sendMessage(req.params.queue, {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        payload: req.body
      });
      res.status(200).json({ status: 'sent' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Start server
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });

  // Handle shutdown
  process.on('SIGTERM', async () => {
    await messaging.dispose();
    process.exit(0);
  });
}

startServer().catch(console.error);
```

## Need Help?

- 📚 Check out the [full documentation](https://github.com/yourusername/little_bunny/wiki)
- 🐛 Found a bug? [Open an issue](https://github.com/yourusername/little_bunny/issues)
- 💡 Have a suggestion? [Create a pull request](https://github.com/yourusername/little_bunny/pulls)

## License

ISC License - Feel free to use this in your projects!
