import { z } from 'zod';

const healthCheckSchema = z.object({
 enabled: z.boolean(),
 interval: z.number().min(1000)
});

const apiConfigSchema = z.object({
 baseUrl: z.string().url(),
 timeout: z.number().min(0).max(30000),
 retryCount: z.number().min(1).max(10),
 retryDelay: z.number().min(100).max(10000),
 healthCheck: healthCheckSchema
});

const rabbitmqConfigSchema = z.object({
 url: z.string(),
 retryCount: z.number().min(1),
 retryDelay: z.number().min(100),
 queueOptions: z.object({
   durable: z.boolean(),
   maxPriority: z.number(),
   deadLetterExchange: z.string().optional(),
   messageTtl: z.number().optional()
 }),
 prefetchCount: z.number().min(1),
 heartbeatInterval: z.number().min(1000),
 reconnectDelay: z.number().min(1000)
});

const monitoringConfigSchema = z.object({
 enabled: z.boolean(),
 metricsPrefix: z.string(),
 flushInterval: z.number().min(1000)
});

export const configSchema = z.object({
 api: apiConfigSchema,
 rabbitmq: rabbitmqConfigSchema,
 monitoring: monitoringConfigSchema,
 fallback: z.object({
   enabled: z.boolean(),
   strategy: z.enum(['api', 'rabbitmq'])
 }).optional()
});

export type MessagingConfig = z.infer<typeof configSchema>;



