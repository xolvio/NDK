import { Command } from './Command';
import { Event } from './Event';
import { Ack } from './Ack';
import { Nack } from './Nack';
import { IReadModel } from './IReadModel';

export interface IMessageBus<Database> {
  // registerEventHandler: <T extends Event>(event: any, handler: (e: T) => Promise<void>) => void;
  registerEventHandler: (handlers: any) => void;

  publish: <T extends Event>(event: T) => Promise<void>;

  registerCommandHandler<T extends Command>(command: new (...args: any[]) => T, handler: (e: T) => Promise<void>): void;

  send: <T extends Command>(command: T) => Promise<Ack | Nack>;

  sendInternal: <T extends Command>(command: T) => Promise<Ack | Nack>;

  registerReadModel: (readModel: IReadModel<Database>) => IReadModel<Database>;

  updateReadModels: <T extends Event>(event: T, em: Database) => Promise<void>;
}
