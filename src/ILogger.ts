export interface ILogger {
  debug(message: string, ...args: unknown[]): void;

  log(message: string, ...args: unknown[]): void;

  warn(message: string, ...args: unknown[]): void;

  error(message: string, ...args: unknown[]): void;

  inspect(object: object): void;
}
