export interface Message {
  id: string;
  timestamp: Date;
  payload: Record<string, unknown>;
  metadata?: MessageMetadata;
}

export interface MessageMetadata {
  priority?: number;
  delay?: number;
  contentType?: string;
  correlationId?: string;
  headers?: Record<string, unknown>;
  retryCount?: number;
  test?: boolean;
}
