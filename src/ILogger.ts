export interface ILogger {
  debug(message: string, ...args: any[]): void;

  log(message: string, ...args: any[]): void;

  warn(message: string, ...args: any[]): void;

  error(message: string, ...args: any[]): void;

  inspect(object: object): void;
}
