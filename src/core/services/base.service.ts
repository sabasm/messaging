import { MessagingConfig } from "../types/config.types";

export abstract class BaseService {
  protected constructor(protected readonly config: MessagingConfig) { }

  protected abstract init(): Promise<void>;
  protected abstract dispose(): Promise<void>;
}


