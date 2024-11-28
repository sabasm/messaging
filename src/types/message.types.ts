export interface MessageMetadata {
  priority?: number;
  delay?: number;
  contentType?: string;
  correlationId?: string;
  timestamp?: Date;
  headers?: Record<string, unknown>;
  retryCount?: number;
  deadLetterQueue?: string;
}

export interface Message {
  id: string;
  timestamp: Date;
  payload: Record<string, unknown>;
  metadata?: MessageMetadata;
}


