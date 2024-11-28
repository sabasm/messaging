export interface Message {
  id: string;
  timestamp: Date;
  payload: Record<string, unknown>;
  metadata?: {
    priority?: number;
    delay?: number;
  };
}


