export interface MessageMetadata {
  priority?: number;
  delay?: number;
  headers?: Record<string, unknown>;
  test?: boolean;
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
