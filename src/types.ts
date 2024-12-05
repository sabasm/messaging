export interface MessageMetadata {
  priority?: number;
  delay?: number;
  contentType?: string;
  correlationId?: string;
  headers?: Record<string, unknown>;
  retryCount?: number;
  test?: boolean;
  processed?: boolean; // Add this line
}
export interface Message {
  id: string;
  timestamp: Date;
  payload: Record<string, unknown>;
  metadata?: MessageMetadata;
}

export interface Context {
  destination: string;
  message: Message;
  metadata: Record<string, unknown>;
}
