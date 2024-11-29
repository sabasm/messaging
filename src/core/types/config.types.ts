import { z } from 'zod';

export const configSchema = z.object({
 messaging: z.object({
   api: z.object({
     baseUrl: z.string().url().default('http://localhost:3000'),
     timeout: z.number().min(1000).max(30000).default(5000),
     retryCount: z.number().min(1).max(10).default(3),
     retryDelay: z.number().min(100).max(10000).default(1000),
     healthCheck: z.object({
       enabled: z.boolean().default(true),
       interval: z.number().min(1000).default(30000)
     }).default({})
   }),
   rabbitmq: z.object({
     url: z.string().default('amqp://localhost'), 
     retryCount: z.number().min(1).max(10).default(3),
     prefetch: z.number().min(1).default(1),
     queues: z.record(z.string()).default({})
   }),
   monitoring: z.object({
     enabled: z.boolean().default(true),
     metricsPrefix: z.string().default('messaging'),
     flushInterval: z.number().min(1000).default(10000)
   })
 })
});

export type MessagingConfig = z.infer<typeof configSchema>;


