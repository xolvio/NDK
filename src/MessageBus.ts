import { IMessageBus } from './IMessageBus';
import { Command } from './Command';
import { Event } from './Event';
import { Ack } from './Ack';
import { Nack } from './Nack';
import { NackErrors } from './NackErrors';
import { getClass, Registry } from './Registry';
import { IReadModel } from './IReadModel';
import { logger } from './Logger';
import { IEventHandler } from './IEventHandler';

type EventHandler = (e: Event) => Promise<void>;
type CommandHandler = (c: Command) => Promise<string | void>;
type ReadModelHandler = (e: Event, em: unknown) => Promise<void>;

export class MessageBus<Database> implements IMessageBus<Database> {
  private readonly _allEventHandlers: EventHandler[] = [];
  private readonly _readModelHandlers: ReadModelHandler[] = [];
  private _eventHandlerFor: { [key: string]: EventHandler[] } = {};
  private _commandHandlerFor: { [key: string]: CommandHandler } = {};

  _registerEventHandler<T extends Event>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    event: new (...args: any[]) => T,
    handler: (e: Event) => Promise<void>,
  ): void {
    logger.debug(`MessageBus:_registerEventHandler ${getClass(handler)} for ${event.name}`);
    if (event.prototype.getType() === '*') {
      this._allEventHandlers.push(handler);
      return;
    }
    if (this._eventHandlerFor[event.name] === undefined) this._eventHandlerFor[event.name] = [];
    this._eventHandlerFor[event.name].push(handler);
  }

  registerEventHandler(eventHandler: IEventHandler<unknown>): void {
    Registry.getInstance().registerEventHandlerInstance(eventHandler, this);
  }

  async publish<T extends Event>(event: T): Promise<void> {
    const eventName = event.constructor.name;
    if (this._eventHandlerFor[eventName] !== undefined) {
      for await (const handler of this._eventHandlerFor[eventName]) {
        logger.debug(
          `MessageBus:publish ${event.constructor.name} ${JSON.stringify(event, null, 2)} to ${getClass(handler)}`,
        );
        await handler(event).catch((e: Error) => {
          logger.error(
            `MessageBus:publish - Error while publishing to ${getClass(handler)}, processing`,
            event,
            '\n',
            e,
          );
          throw e;
        });
      }
    }
    for await (const handler of this._allEventHandlers) {
      await handler(event).catch((e: Error) => {
        logger.error(
          `MessageBus:publish_allEventHandlers - Error while publishing to ${getClass(handler)}, processing`,
          event,
          '\n',
          e,
        );
        throw e;
      });
    }
  }

  registerCommandHandlers(commandHandler: object): void {
    Registry.getInstance().registerCommandHandlerInstance(commandHandler, this);
  }

  registerCommandHandler<T extends Command>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    command: new (...args: any[]) => T,
    handler: (c: Command) => Promise<string | void>,
  ): void {
    // registerCommandHandler(command: new (...args: any[]) => Command, handler: Function): void {
    logger.debug(`MessageBus:registerCommandHandler ${getClass(handler)} for ${command.name}`);
    const commandName = command.name;
    // (c: Command) => Promise<void>;
    this._commandHandlerFor[commandName] = handler;
  }

  async send<T extends Command>(command: T): Promise<Ack | Nack> {
    const commandName = command.constructor.name;
    if (this._commandHandlerFor[commandName] === undefined) {
      logger.warn(`No handler registered for ${commandName}`);
      return new Nack(NackErrors.CommandHandlerNotFound);
    }
    logger.debug(
      `MessageBus:send sending ${commandName} ${JSON.stringify(command, null, 2)} to ${getClass(
        this._commandHandlerFor[commandName],
      )}`,
    );
    try {
      const res = await this._commandHandlerFor[commandName](command);
      if (!res) return new Ack();
      return new Nack(res);
    } catch (e) {
      logger.error(
        `MessageBus:send - Error while executing ${getClass(this._commandHandlerFor[commandName])} processing`,
        command,
        '\n',
        e,
      );
      return new Nack(NackErrors.ApplicationError);
    }
  }

  async sendInternal<T extends Command>(command: T): Promise<Ack | Nack> {
    logger.debug(`MessageBus:sendInternal - sending command`, command);
    return this.send(command);
  }

  _registerReadModel(handler: EventHandler): void {
    logger.debug(`MessageBus:_registerReadModel ${getClass(handler)}`);
    this._readModelHandlers.push(handler);
  }

  registerReadModel(readModel: IReadModel<Database>): IReadModel<Database> {
    Registry.getInstance().registerReadModelHandlerInstance(readModel, this);
    return readModel;
  }

  async updateReadModels<T extends Event>(event: T, em: Database): Promise<void> {
    for await (const handler of this._readModelHandlers) {
      logger.debug(
        `MessageBus:updateReadModels - Updating ${getClass(handler)} with ${event.constructor.name} ${JSON.stringify(
          event,
          null,
          2,
        )}`,
      );
      await handler(event, em).catch((e: Error) => {
        logger.error(
          `MessageBus:updateReadModels - Error while updating read model ${getClass(handler)}, processing`,
          event,
          '\n',
          e,
        );
        throw e;
      });
    }
  }
}
