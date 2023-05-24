import { ANY, CATCHUP, Command, Event, Handles, IReadModel, MessageBus, Registry } from '.';

class BarCommand extends Command {
  constructor(id: string) {
    super(id);
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

class BazCommandHandlers {
  @Handles(BarCommand)
  doSomething() {
    // empty for testing
  }
}

class KazCommandHandlers {
  doSomething() {
    // empty for testing
  }
}

class FooEventHandlers {
  @Handles(FooEvent)
  handleSomething() {
    // empty for testing
  }

  @Handles(ANY)
  handleAny() {
    // empty for testing
  }
}

class BarEventHandlers {
  handleSomething() {
    // empty for testing
  }
}

class MyReadModel implements IReadModel<unknown> {
  @Handles(CATCHUP)
  async handle(): Promise<void> {
    // empty for testing
  }
}

class MyOtherReadModel implements IReadModel<unknown> {
  async handle(): Promise<void> {
    // empty for testing
  }
}

describe('Registry', () => {
  describe('getInstance', () => {
    it('should return the same instance on multiple calls', () => {
      const firstInstance = Registry.getInstance();
      const secondInstance = Registry.getInstance();
      expect(firstInstance).toBe(secondInstance);
    });
    it('should return an instance with an empty registry', () => {
      expect(Registry.getInstance()).toMatchObject({});
      expect(Registry.getInstance().commandHandlers).toMatchObject({});
      expect(Registry.getInstance().readModelHandlers).toMatchObject({});
      expect(Registry.getInstance().readModels).toMatchObject({});
      expect(Registry.getInstance().eventHandlers).toMatchObject({});
    });
  });

  describe('special events', () => {
    it('should export an ANY event', () => {
      expect(new ANY().getType()).toBe('*');
    });
    it('should export a CATCHUP event', () => {
      expect(new CATCHUP().getType()).toBe('*');
    });
  });
  describe('registerCommandHandlerInstance', () => {
    it('should register command handlers with the message bus', () => {
      const messageBus = { registerCommandHandler: jest.fn() } as unknown as MessageBus<unknown>;
      const bazCommandHandlers = new BazCommandHandlers();
      Registry.getInstance().registerCommandHandlerInstance(bazCommandHandlers, messageBus);
      expect(messageBus.registerCommandHandler).toBeCalled();
    });
    it('should not register command handlers with the message bus if the event handler has not been decorated', () => {
      const messageBus = { registerCommandHandler: jest.fn() } as unknown as MessageBus<unknown>;
      const kazCommandHandlers = new KazCommandHandlers();
      Registry.getInstance().registerCommandHandlerInstance(kazCommandHandlers, messageBus);
      expect(messageBus.registerCommandHandler).not.toBeCalled();
    });
  });
  describe('registerEventHandlerInstance', () => {
    it('should register event handlers with the message bus', () => {
      const messageBus = { _registerEventHandler: jest.fn() } as unknown as MessageBus<unknown>;
      const fooEventHandler = new FooEventHandlers();
      Registry.getInstance().registerEventHandlerInstance(fooEventHandler, messageBus);
      expect(messageBus._registerEventHandler).toBeCalled();
    });
    it('should not register event handlers with the message bus if the event handler has not been decorated', () => {
      const messageBus = { _registerEventHandler: jest.fn() } as unknown as MessageBus<unknown>;
      const barEventHandler = new BarEventHandlers();
      Registry.getInstance().registerEventHandlerInstance(barEventHandler, messageBus);
      expect(messageBus._registerEventHandler).not.toBeCalled();
    });
  });
  describe('registerReadModelHandlerInstance', () => {
    it('should register read models with the message bus', () => {
      const messageBus = { _registerReadModel: jest.fn() } as unknown as MessageBus<unknown>;
      const myReadModel = new MyReadModel();
      Registry.getInstance().registerReadModelHandlerInstance(myReadModel, messageBus);
      expect(messageBus._registerReadModel).toBeCalled();
    });
    it('should not register read models with the message bus if the handle method has not been decorated', () => {
      const messageBus = { _registerReadModel: jest.fn() } as unknown as MessageBus<unknown>;
      const myOtherReadModel = new MyOtherReadModel();
      Registry.getInstance().registerReadModelHandlerInstance(myOtherReadModel, messageBus);
      expect(messageBus._registerReadModel).not.toBeCalled();
    });
  });
});
