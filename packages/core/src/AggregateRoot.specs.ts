import { AggregateRoot, Event } from '.';

class SomethingHappenedEvent extends Event {
  public constructor(public readonly id: string) {
    super(id);
  }

  getType(): string {
    return 'SomethingHappened';
  }
}

class UnsupportedEvent extends Event {
  public constructor(id: string) {
    super(id);
  }

  getType(): string {
    return 'UnsupportedEvent';
  }
}

class Aggregate extends AggregateRoot {
  public eventIds: string[] = [];

  public doSomething(): boolean {
    return this.applyChange(new SomethingHappenedEvent('123'));
  }

  public doSomethingErroneous(): boolean {
    return this.applyError('Something happened');
  }

  public applySomethingHappenedEvent(event: SomethingHappenedEvent): void {
    this.eventIds.push(event.id);
  }

  public applyAnEventWithoutAHandler(): void {
    this.applyChange(new UnsupportedEvent('123'));
  }
}

describe('AggregateRoot', () => {
  describe('applyChange', () => {
    it('should throw an exception when an event handler is not defined for an applied event', function () {
      const aggregate = new Aggregate('');
      expect(() => aggregate.applyAnEventWithoutAHandler()).toThrow();
    });
  });
  describe('loadFromHistory', () => {
    it('should load an aggregate from a stream of events', () => {
      const aggregate = new Aggregate('');
      aggregate.loadFromHistory([
        {
          streamId: 'stream',
          event: new SomethingHappenedEvent('123'),
          eventType: 'SomethingHappened',
          revision: BigInt(1),
          position: BigInt(0),
        },
        {
          streamId: 'stream',
          event: new SomethingHappenedEvent('456'),
          eventType: 'SomethingHappened',
          revision: BigInt(2),
          position: BigInt(1),
        },
      ]);
      expect(aggregate.eventIds).toEqual(['123', '456']);
    });
    it('should load an aggregate containing non existent events from a stream of events', () => {
      const aggregate = new Aggregate('');
      aggregate.loadFromHistory([
        {
          streamId: 'stream',
          event: undefined,
          eventType: 'SomethingHappened',
          revision: BigInt(1),
          position: BigInt(0),
        },
        {
          streamId: 'stream',
          event: new SomethingHappenedEvent('456'),
          eventType: 'SomethingHappened',
          revision: BigInt(2),
          position: BigInt(1),
        },
      ]);
      expect(aggregate.eventIds).toEqual(['456']);
    });
  });
  describe('getUncommittedChanges', () => {
    it('should return the list of events that have not been marked as committed', () => {
      const aggregate = new Aggregate('');
      aggregate.doSomething();
      expect(aggregate.getUncommittedChanges().length).toBe(1);
      const event = aggregate.getUncommittedChanges()[0];
      expect(event instanceof SomethingHappenedEvent).toBe(true);
    });
    it('should not return events that have been marked as committed', () => {
      const aggregate = new Aggregate('');
      aggregate.doSomething();
      aggregate.markChangesAsCommitted();
      expect(aggregate.getUncommittedChanges().length).toBe(0);
    });
  });
  describe('error handling', () => {
    it('should return true and not set an error message when there is no error', () => {
      const aggregate = new Aggregate('');
      const res = aggregate.doSomething();
      expect(res).toBe(true);
      expect(aggregate.getError()).toBeUndefined();
    });
    it('should return false and set an error message when there is an error', () => {
      const aggregate = new Aggregate('');
      const res = aggregate.doSomethingErroneous();
      expect(res).toBe(false);
      expect(aggregate.getError()).toEqual('Something happened');
    });
  });
});
