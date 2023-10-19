import { ICommandHandler } from './ICommandHandler';
import { Command } from './Command';

export interface IService extends ICommandHandler {
  handle: (command: Command) => Promise<void>;
}
