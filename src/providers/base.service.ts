import { MessagingConfig } from '../core/types/config.types';

export abstract class BaseService {
  constructor(protected readonly config: Partial<MessagingConfig>) {}

  abstract init(): Promise<void>;
  abstract dispose(): Promise<void>;
}


