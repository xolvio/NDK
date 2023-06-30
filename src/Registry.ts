import { Command, Event, IReadModel, Message, MessageBus } from '.';

export class ANY extends Event {
  public constructor() {
    super();
  }

  getType(): string {
    return '*';
  }
}

export function getClass<T>(object: T): string {
  // @ts-ignore
  return object['clazz'];
}

export function setClass<T>(object: T, className: string): void {
  // @ts-ignore
  object['clazz'] = className;
}

export interface MessageHandler<T> {
  handler: (message: T) => Promise<void>;
}

export interface CommandHandler<T> extends MessageHandler<T> {
  command: new (...args: unknown[]) => Command;
}

export interface EventHandler<T> extends MessageHandler<T> {
  event: new (...args: unknown[]) => Event;
}

export class Registry {
  readonly commandHandlers: { [key: string]: { [key: string]: CommandHandler<unknown> } } = {};
  readonly eventHandlers: { [key: string]: { [key: string]: EventHandler<unknown> } } = {};
  readonly readModelHandlers: { [key: string]: (message: unknown) => Promise<void> } = {};
  readonly readModels = {};

  private constructor() {
    // private constructor
  }

  private static instance: Registry;

  static getInstance(): Registry {
    if (!this.instance) {
      this.instance = new Registry();
    }
    return this.instance;
  }

  registerCommandHandlerInstance<Database>(instance: object, messageBus: MessageBus<Database>): void {
    const clazz = instance.constructor.name;
    if (!this.commandHandlers[clazz]) return;
    Object.keys(this.commandHandlers[clazz]).forEach((commandName) => {
      const handler = this.commandHandlers[clazz][commandName].handler;
      const boundHandler = handler.bind(instance);
      setClass(boundHandler, clazz);
      const command = this.commandHandlers[clazz][commandName]?.command;
      messageBus.registerCommandHandler(command, boundHandler);
    });
  }

  registerEventHandlerInstance<Database>(instance: object, messageBus: MessageBus<Database>): void {
    const clazz = instance.constructor.name;
    if (!this.eventHandlers[clazz]) return;
    Object.keys(this.eventHandlers[clazz]).forEach((eventName) => {
      const handler = this.eventHandlers[clazz][eventName].handler;
      const boundHandler = handler.bind(instance);
      setClass(boundHandler, clazz);
      const event = this.eventHandlers[clazz][eventName].event;
      if (event) messageBus._registerEventHandler(event, boundHandler);
    });
  }

  registerReadModelHandlerInstance(instance: IReadModel<unknown>, messageBus: MessageBus<unknown>): void {
    const clazz = instance.constructor.name;
    if (!this.readModelHandlers[clazz]) return;
    const handler = this.readModelHandlers[clazz];
    const boundHandler = handler.bind(instance);
    setClass(boundHandler, clazz);
    messageBus._registerReadModel(boundHandler);
  }
}

export class CATCHUP extends Event {
  public constructor() {
    super();
  }

  getType(): string {
    return '*';
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function Handles<M extends Message>(message: new (...args: any[]) => M) {
  return function (target: object, _propertyKey: string, descriptor: PropertyDescriptor): void {
    const registry = Registry.getInstance();
    if (message.name === CATCHUP.name) {
      if (!registry.readModelHandlers[target.constructor.name])
        registry.readModelHandlers[target.constructor.name] = descriptor.value;
    }
    if (message.prototype instanceof Command) {
      const command = message as new (...args: unknown[]) => Command;
      if (!registry.commandHandlers[target.constructor.name]) registry.commandHandlers[target.constructor.name] = {};
      registry.commandHandlers[target.constructor.name][command.name] = { command, handler: descriptor.value };
    }
    // the name check is needed here because the @Serialize decorator is somehow mangling the type
    if (message.prototype instanceof Event || message.name.endsWith('Event')) {
      const event = message as unknown as new (...args: unknown[]) => Event;
      if (!registry.eventHandlers[target.constructor.name]) registry.eventHandlers[target.constructor.name] = {};
      registry.eventHandlers[target.constructor.name][event.name] = { event, handler: descriptor.value };
    }
  };
}
