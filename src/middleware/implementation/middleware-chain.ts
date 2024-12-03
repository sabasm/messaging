import { injectable } from 'inversify';
import { Context, Middleware } from '../types';

@injectable()
export class MiddlewareChain {
  private middlewares: Middleware[] = [];

  add(middleware: Middleware): void {
    this.middlewares.push(middleware);
    this.sortMiddlewares();
  }

  private sortMiddlewares(): void {
    this.middlewares.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }

  async execute(context: Context): Promise<void> {
    const executeChain = async (index: number): Promise<void> => {
      if (index >= this.middlewares.length) return;
      await this.middlewares[index].handler(context, () => executeChain(index + 1));
    };
    await executeChain(0);
  }
}


