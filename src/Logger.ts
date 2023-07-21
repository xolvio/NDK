import { ILogger } from './ILogger';
import { inspect } from 'util';

class Logger implements ILogger {
  private static _instance: Logger;

  private constructor() {
    // private constructor to prevent instantiation
  }

  static getInstance(): ILogger {
    if (this._instance === undefined) this._instance = new Logger();
    return this._instance;
  }

  debug(message: string, ...args: unknown[]): void {
    const debug = !!(parseInt(process.env.DEBUG as string) || process.env.DEBUG === 'true');
    // eslint-disable-next-line no-console
    if (debug) console.debug(message, ...args);
  }

  log(message: string, ...args: unknown[]): void {
    // eslint-disable-next-line no-console
    console.log(message, ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    // eslint-disable-next-line no-console
    console.warn(message, ...args);
  }

  error(message: string, ...args: unknown[]): void {
    // eslint-disable-next-line no-console
    console.error(message, ...args);
  }

  inspect(object: object): void {
    this.log(inspect(object, false, null, true));
  }
}

export const logger = Logger.getInstance();
