import { Command } from './Command';
import { Event } from './Event';
import { Ack } from './Ack';
import { Nack } from './Nack';
import { IReadModel } from './IReadModel';
import { IEventHandler } from './IEventHandler';

export interface IMessageBus<Database> {
  registerEventHandler(eventHandler: IEventHandler<unknown>): void;

  publish<T extends Event>(event: T): Promise<void>;

  registerCommandHandler<T extends Command>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    command: new (...args: any[]) => T,
    handler: (c: Command) => Promise<string | void>,
  ): void;

  send: <T extends Command>(command: T) => Promise<Ack | Nack>;

  sendInternal: <T extends Command>(command: T) => Promise<Ack | Nack>;

  registerReadModel: (readModel: IReadModel<Database>) => IReadModel<Database>;

  updateReadModels: <T extends Event>(event: T, em: Database) => Promise<void>;
}
