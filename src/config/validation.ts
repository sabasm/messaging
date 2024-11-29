import { z } from 'zod';

export const messageSchema = z.object({
  id: z.string(),
  timestamp: z.date(),
  payload: z.record(z.unknown()),
  metadata: z.object({
    priority: z.number().min(0).max(10).optional(),
    delay: z.number().min(0).optional(),
    contentType: z.string().optional(),
    correlationId: z.string().optional(),
    headers: z.record(z.unknown()).optional(),
    retryCount: z.number().min(0).optional(),
    deadLetterQueue: z.string().optional()
  }).optional()
});

export type ValidMessage = z.infer<typeof messageSchema>;


