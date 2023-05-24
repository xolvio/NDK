import { ILogger } from './ILogger';

class Logger implements ILogger {
  private static _instance: Logger;

  private constructor() {}

  static getInstance(): ILogger {
    if (this._instance === undefined) this._instance = new Logger();
    return this._instance;
  }

  debug(message: string, ...args: any[]): void {
    const debug = !!(parseInt(process.env.DEBUG as string) || process.env.DEBUG === 'true');
    // eslint-disable-next-line no-console
    if (debug) console.debug(message, ...args);
  }

  log(message: string, ...args: any[]): void {
    // eslint-disable-next-line no-console
    console.log(message, ...args);
  }

  warn(message: string, ...args: any[]): void {
    // eslint-disable-next-line no-console
    console.warn(message, ...args);
  }

  error(message: string, ...args: any[]): void {
    // eslint-disable-next-line no-console
    console.error(message, ...args);
  }

  inspect(object: object): void {
    this.log(require('util').inspect(object, false, null, true));
  }
}

export const logger = Logger.getInstance();
