// import express from 'express';
// import { MessagingConfigBuilder, MessagingFactory } from '../src';

// async function setupMessaging() {
//   // API-first configuration with RabbitMQ fallback
//   const config = new MessagingConfigBuilder()
//     .withApiMessaging({
//       baseUrl: process.env.API_URL || 'http://api.example.com',
//       timeout: 5000,
//       healthCheck: { enabled: true, interval: 30000 }
//     })
//     .withRabbitMQ({
//       url: process.env.RABBITMQ_URL || 'amqp://localhost',
//       prefetch: 10
//     })
//     .withFallback('rabbitmq')
//     .build();

//   return new MessagingFactory(config).create();
// }

// async function startServer() {
//   const app = express();
//   const messaging = await setupMessaging();

//   app.post('/messages/:queue', async (req, res) => {
//     try {
//       await messaging.sendMessage(req.params.queue, {
//         id: crypto.randomUUID(),
//         timestamp: new Date(),
//         payload: req.body
//       });
//       res.status(200).json({ status: 'sent' });
//     } catch (error) {
//       res.status(500).json({ error: error.message });
//     }
//   });

//   app.post('/messages/:queue/batch', async (req, res) => {
//     try {
//       const messages = req.body.map(payload => ({
//         id: crypto.randomUUID(),
//         timestamp: new Date(),
//         payload
//       }));
//       await messaging.sendBatch(req.params.queue, messages);
//       res.status(200).json({ status: 'sent' });
//     } catch (error) {
//       res.status(500).json({ error: error.message });
//     }
//   });

//   // Graceful shutdown
//   process.on('SIGTERM', async () => {
//     await messaging.dispose();
//     process.exit(0);
//   });

//   const port = process.env.PORT || 3000;
//   app.listen(port, () => {
//     console.log(`Server running on port ${port}`);
//   });
// }

// startServer().catch(console.error);