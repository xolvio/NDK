import { Command, Event, IReadModel, Message, MessageBus } from '.';

export class ANY extends Event {
  public constructor() {
    super();
  }

  getType(): string {
    return '*';
  }
}

interface Handler {
  handler: Function;
}

interface CommandHandler extends Handler {
  command: new (...args: any[]) => Command;
}

interface EventHandler extends Handler {
  event: new (...args: any[]) => Event;
}

export class Registry {
  readonly commandHandlers: { [key: string]: { [key: string]: CommandHandler } } = {};
  readonly eventHandlers: { [key: string]: { [key: string]: EventHandler } } = {};
  readonly readModelHandlers: { [key: string]: Function } = {};
  readonly readModels = {};

  private constructor() {
  }

  private static instance: Registry;

  static getInstance() {
    if (!this.instance) {
      this.instance = new Registry();
    }
    return this.instance;
  }

  registerCommandHandlerInstance<Database>(instance: object, messageBus: MessageBus<Database>) {
    const clazz = instance.constructor.name;
    if (!this.commandHandlers[clazz]) return;
    Object.keys(this.commandHandlers[clazz]).forEach((commandName) => {
      const handler = this.commandHandlers[clazz][commandName].handler;
      const boundHandler = handler.bind(instance);
      // @ts-ignore
      boundHandler['clazz'] = clazz;
      const command = this.commandHandlers[clazz][commandName]?.command;
      messageBus.registerCommandHandler(command, boundHandler);
    });
  }

  registerEventHandlerInstance<Database>(instance: object, messageBus: MessageBus<Database>) {
    const clazz = instance.constructor.name;
    if (!this.eventHandlers[clazz]) return;
    Object.keys(this.eventHandlers[clazz]).forEach((eventName) => {
      const handler = this.eventHandlers[clazz][eventName].handler;
      const boundHandler = handler.bind(instance);
      boundHandler.clazz = clazz;
      const event = this.eventHandlers[clazz][eventName].event;
      if (event) messageBus._registerEventHandler(event, boundHandler);
    });
  }

  registerReadModelHandlerInstance(instance: IReadModel<unknown>, messageBus: MessageBus<unknown>) {
    const clazz = instance.constructor.name;
    if (!this.readModelHandlers[clazz]) return;
    const handler = this.readModelHandlers[clazz];
    const boundHandler = handler.bind(instance);
    boundHandler.clazz = clazz;
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

// eslint-disable-next-line @typescript-eslint/naming-convention
export function Handles<M extends Message>(message: new (...args: any[]) => M) {
  return function(target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
    const registry = Registry.getInstance();
    if (message.name === CATCHUP.name) {
      if (!registry.readModelHandlers[target.constructor.name])
      registry.readModelHandlers[target.constructor.name] = descriptor.value as Function;
    }
    if (message.prototype instanceof Command) {
      const command = message as new (...args: any[]) => Command;
      if (!registry.commandHandlers[target.constructor.name]) registry.commandHandlers[target.constructor.name] = {};
      registry.commandHandlers[target.constructor.name][command.name] = { command, handler: descriptor.value };
    }
    // the name check is needed here because the @Serialize decorator is somehow mangling the type
    if (message.prototype instanceof Event || message.name.endsWith('Event')) {
      const event = message as unknown as new (...args: any[]) => Event;
      if (!registry.eventHandlers[target.constructor.name]) registry.eventHandlers[target.constructor.name] = {};
      registry.eventHandlers[target.constructor.name][event.name] = { event, handler: descriptor.value };
    }
  };
}
