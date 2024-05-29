import { MessageBus } from './MessageBus';
import { Event } from './Event';
import { ANY, Registry } from './Registry';
import { Command } from './Command';
import { NackErrors } from './NackErrors';
import { Nack } from './Nack';
import { IReadModel } from './IReadModel';
import { Ack } from './Ack';

class FooCommand extends Command {
  constructor(public readonly id: string) {
    super();
  }
}

class FooEvent extends Event {
  constructor(id: string) {
    super(id);
  }

  getType(): string {
    return 'foo';
  }
}

class BarEvent extends Event {
  constructor(id: string) {
    super(id);
  }

  getType(): string {
    return 'bar';
  }
}

class MyReadModel implements IReadModel<unknown> {
  async handle(): Promise<void> {
    // empty for testing
  }
}

describe('MessageBus', () => {
  describe('EventHandlers', () => {
    it('should allow wildcard subscription', async () => {
      const messageBus = MessageBus.getInstance();

      const events: Event[] = [];
      messageBus._registerEventHandler(ANY, async (event: Event): Promise<void> => {
        events.push(event);
      });

      const foo = new FooEvent('1');
      const bar = new BarEvent('2');
      await messageBus.publish(foo);
      await messageBus.publish(bar);

      expect(events.length).toBe(2);
      expect(events[0]).toEqual(foo);
      expect(events[1]).toEqual(bar);
    });
    it('should allow wildcard subscription', async () => {
      const messageBus = MessageBus.getInstance();

      const events: Event[] = [];
      messageBus._registerEventHandler(FooEvent, async (event: Event): Promise<void> => {
        events.push(event);
      });

      const foo = new FooEvent('1');
      const bar = new BarEvent('2');
      await messageBus.publish(foo);
      await messageBus.publish(bar);

      expect(events.length).toBe(1);
      expect(events[0]).toEqual(foo);
    });
    it('should register event handlers with the registry', () => {
      const registry = Registry.getInstance();
      jest.spyOn(registry, 'registerEventHandlerInstance');
      const messageBus = MessageBus.getInstance();
      // messageBus.registerEventHandler();
      const eventHandler = {
        handle: async (): Promise<void> => {
          // empty for testing
        },
      };
      messageBus.registerEventHandler(eventHandler);
      expect(registry.registerEventHandlerInstance).toHaveBeenCalledWith(eventHandler, messageBus);
    });
  });
  describe('publish', () => {
    it('should call the specific event handlers', async () => {
      const messageBus = MessageBus.getInstance();
      const mock = jest.fn();
      const handler = async (e: Event) => {
        mock(e);
      };
      messageBus._registerEventHandler(FooEvent, handler);

      await messageBus.publish(new FooEvent('1'));

      expect(mock).toHaveBeenCalled();
    });
    it('should call wildcard event handlers', async () => {
      const messageBus = MessageBus.getInstance();
      const mock = jest.fn();
      const handler = async (e: Event) => {
        mock(e);
      };
      messageBus._registerEventHandler(ANY, handler);

      await messageBus.publish(new FooEvent('1'));

      expect(mock).toHaveBeenCalled();
    });
    it('should log errors from specific handlers and rethrow', async () => {
      const messageBus = MessageBus.getInstance();
      const handler = async () => {
        throw new Error('foo');
      };
      messageBus._registerEventHandler(FooEvent, handler);
      // eslint-disable-next-line no-console
      console.error = jest.fn(); // disable console.error for this test
      await expect(messageBus.publish(new FooEvent('1'))).rejects.toThrow();
    });
    it('should log errors from wildcard handlers and rethrow', async () => {
      const messageBus = MessageBus.getInstance();
      const handler = async () => {
        throw new Error('foo');
      };
      messageBus._registerEventHandler(ANY, handler);
      // eslint-disable-next-line no-console
      console.error = jest.fn(); // disable console.error for this test
      await expect(messageBus.publish(new FooEvent('1'))).rejects.toThrow();
    });
  });
  describe('CommandHandlers', () => {
    it('should register command handlers with the registry', () => {
      const registry = Registry.getInstance();
      jest.spyOn(registry, 'registerCommandHandlerInstance');

      const messageBus = MessageBus.getInstance();
      messageBus.registerCommandHandlers({});
      expect(registry.registerCommandHandlerInstance).toHaveBeenCalledWith({}, messageBus);
    });
    it('should send commands to the respective command handler', async () => {
      const messageBus = MessageBus.getInstance();
      const mock = jest.fn();
      const handler = async (c: Command) => mock(c);

      messageBus.registerCommandHandler(FooCommand, handler);

      await messageBus.send(new FooCommand('1'));

      expect(mock).toHaveBeenCalled();
    });
    it('should warn when there are no command handlers', async () => {
      const messageBus = MessageBus.getInstance();
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {
        // empty for testing
      });
      const res = (await messageBus.send(new FooCommand('1'))) as Nack;
      expect(res.errorCode).toEqual(NackErrors.CommandHandlerNotFound);
      expect(warn).toHaveBeenCalled();
    });
    it('should return an ACK when there are no errors from command handlers', async () => {
      const messageBus = MessageBus.getInstance();
      const handler = async () => {
        // empty for testing
      };
      messageBus.registerCommandHandler(FooCommand, handler);
      const res = (await messageBus.send(new FooCommand('1'))) as Nack;
      expect(res.constructor.name).toEqual(Ack.name);
    });
    it('should return an ACK when the command returns an empty message', async () => {
      const handler = async () => '';
      const messageBus = MessageBus.getInstance();
      messageBus.registerCommandHandler(FooCommand, handler);
      const res = (await messageBus.send(new FooCommand('1'))) as Nack;
      expect(res.constructor.name).toEqual(Ack.name);
    });
    it('should return a NACK when the command handler returns an error message', async () => {
      const messageBus = MessageBus.getInstance();
      const handler = async () => 'Some error occurred';
      messageBus.registerCommandHandler(FooCommand, handler);

      const res = (await messageBus.send(new FooCommand('1'))) as Nack;

      expect(res.constructor.name).toEqual(Nack.name);
      expect(res.errorCode).toEqual('Some error occurred');
    });
    it('should return a NACK when a command handlers throws an error', async () => {
      const messageBus = MessageBus.getInstance();
      const handler = async () => {
        throw new Error('foo');
      };
      messageBus.registerCommandHandler(FooCommand, handler);

      const res = (await messageBus.send(new FooCommand('1'))) as Nack;

      expect(res.errorCode).toEqual(NackErrors.ApplicationError);
    });
    it('should send internal commands to the respective command handler', () => {
      const messageBus = MessageBus.getInstance();
      const mock = jest.fn();
      const handler = async (c: Command) => mock(c);

      messageBus.registerCommandHandler(FooCommand, handler);

      messageBus.sendInternal(new FooCommand('1'));

      expect(mock).toHaveBeenCalled();
    });
  });
  describe('ReadModel', () => {
    it('should register read models with the registry and return them', () => {
      const registry = Registry.getInstance();
      jest.spyOn(registry, 'registerReadModelHandlerInstance');
      const messageBus = MessageBus.getInstance();
      const myReadModel = new MyReadModel();
      const readModel = messageBus.registerReadModel(myReadModel);
      expect(registry.registerReadModelHandlerInstance).toHaveBeenCalledWith(readModel, messageBus);
      expect(readModel).toBe(myReadModel);
    });
    it('should update read registered models', async () => {
      const messageBus = MessageBus.getInstance();
      const myReadModel = new MyReadModel();
      jest.spyOn(myReadModel, 'handle');

      messageBus._registerReadModel(myReadModel.handle);
      const readModel = messageBus.registerReadModel(myReadModel);

      const event = new FooEvent('1');
      await messageBus.updateReadModels(event, 'foo');

      expect(readModel.handle).toHaveBeenCalledWith(event, 'foo');
    });
    it('should log and rethrow errors from read models', async () => {
      const messageBus = MessageBus.getInstance();
      const myReadModel = new MyReadModel();
      myReadModel.handle = async () => {
        throw new Error('bar');
      };
      messageBus._registerReadModel(myReadModel.handle);
      messageBus.registerReadModel(myReadModel);

      // eslint-disable-next-line no-console
      console.error = jest.fn(); // disable console.error for this test
      await expect(messageBus.updateReadModels(new FooEvent('1'), 'foo')).rejects.toThrow();
    });
  });
});
