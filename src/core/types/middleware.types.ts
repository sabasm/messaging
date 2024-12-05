import { Message } from "../../types";

export interface Context {
  destination: string;
  message: Message;
  metadata: Record<string, unknown>;
}

export type NextFunction = () => Promise<void>;
export type MiddlewareFunction = (context: Context, next: NextFunction) => Promise<void>;

export interface Middleware {
  handler: MiddlewareFunction;
  priority?: number;
}


