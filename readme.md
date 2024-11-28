
# Messaging Service Codebase Documentation

## Project Overview

This is a TypeScript-based messaging service project built to manage messaging operations using RabbitMQ and HTTP APIs, adhering to SOLID, KISS, and DRY principles. The project is developed with a focus on modularity, scalability, and testability, leveraging NestJS and Inversify for dependency injection.

### Key Components

- **Messaging Context**: Manages message sending strategies, including fallback mechanisms when the primary strategy fails.
- **Monitoring Service**: Logs metrics such as messages sent, messages failed, and connection errors.
- **RabbitMqMessagingService**: Handles RabbitMQ message queues, utilizing a connection manager to ensure stability.
- **ApiMessagingService**: Handles messaging via HTTP endpoints with retry mechanisms.
- **Mock Services**: Used for testing and isolating functionality.

## Key Configuration Files

### ESLint Configuration (`.eslintrc.js`)

- Uses `@typescript-eslint` parser and plugins.
- Enforces best practices such as explicit function return types and error handling for unused variables.

### TypeScript Configuration (`tsconfig.json`)

- Targets `es2020`.
- Includes decorators for dependency injection (`experimentalDecorators` and `emitDecoratorMetadata`).
- Includes strict type-checking settings for robustness.

### Jest Configuration (`jest.config.js`)

- Configures `ts-jest` to run tests in Node environment.
- Enforces 100% test coverage for branches, functions, lines, and statements.

## Services Overview

### Messaging Services

1. **RabbitMqMessagingService**
   - Handles RabbitMQ messaging, including connection management and queue assertions.
   - Implements retry mechanisms to maintain stable messaging operations.

2. **ApiMessagingService**
   - Sends messages through HTTP endpoints.
   - Provides retry logic and metrics logging.

### Monitoring Service

- Implements metrics collection for the messaging service using methods like `increment()`, `gauge()`, and `histogram()` to record different metrics.
- A **MockMonitoringService** is used in unit tests to verify interactions without hitting actual monitoring systems.

### Messaging Context

- **MessagingContext.ts** handles the strategy pattern for sending messages.
- Allows switching between different messaging strategies, e.g., primary and fallback services.

## Testing

- Unit tests are provided for all core services, ensuring high code quality and reliability.
- Tests are organized into suites such as `container.test.ts` (for dependency injection container validation), `integration/messaging.integration.test.ts` (for integration tests), and service-specific tests like `ApiMessagingService.test.ts`.
- **Coverage Summary**:
  - Statements: 100%
  - Branches: 94.44% (indicating some minor areas for additional test coverage)
  - Functions: 100%
  - Lines: 100%

## Key Libraries

- **Inversify**: Used for dependency injection to ensure decoupled services.
- **Reflect-metadata**: Provides metadata reflection, necessary for the use of decorators with Inversify.
- **amqplib**: Manages RabbitMQ connections.
- **axios**: Used to handle HTTP messaging in `ApiMessagingService`.

## Build and Test Commands

- **Build**: `npm run build`
  - Pre-build: Clean (`npm run clean`) removes previous distribution files.
  - Compiles TypeScript files into JavaScript using `tsc`.
- **Lint**: `npm run lint`
  - Uses ESLint to enforce coding standards.
- **Test**: `npm test`
  - Runs all Jest test suites with coverage reporting.

## Summary of Important Metrics and Logs

- The `MonitoringService` logs metrics like `messages_sent`, `messages_failed`, and `batches_sent` to keep track of message status.
- Each service (`ApiMessagingService` and `RabbitMqMessagingService`) records metrics for success and failures, providing valuable insights for debugging and operational monitoring.

## Future Improvements

- **Test Coverage for Branches**: Increase coverage for the remaining 5.56% of branches to meet the global threshold requirement.
- **Logging Enhancements**: Consider adding more detailed logs in services to trace messages more precisely, especially during retries or failures.
- **Scalability**: Implement additional optimization for large-scale deployments, such as connection pooling or advanced RabbitMQ configuration.

```

## Example Usage in an Express App

Below is an example of how you could integrate the `MessagingService` in an Express.js application:

```typescript
import express from 'express';
import { container } from './src/container';
import { TYPES } from './src/constants';
import { MessagingContext } from './src/MessagingContext';
import { Message } from './src/types/message.types';

const app = express();
const port = 3000;

// Get an instance of the MessagingContext from the Inversify container
const messagingContext = container.get<MessagingContext>(TYPES.MessagingContext);

app.use(express.json());

app.post('/send-message', async (req, res) => {
  try {
    const { destination, payload } = req.body;
    const message: Message = {
      id: 'unique-message-id',
      timestamp: new Date(),
      payload,
    };

    await messagingContext.sendMessage(destination, message);
    res.status(200).send('Message sent successfully');
  } catch (error) {
    res.status(500).send(`Failed to send message: ${error.message}`);
  }
});

app.listen(port, () => {
  console.log(`Messaging service app listening at http://localhost:${port}`);
});
```

This Express app sets up a basic `/send-message` route that uses the `MessagingContext` to send messages to a given destination. The `MessagingContext` is fetched from the Inversify container, which automatically handles dependency injection for the messaging service. This setup ensures that you can easily switch between messaging implementations, such as RabbitMQ or an HTTP API, without changing the core application logic.
