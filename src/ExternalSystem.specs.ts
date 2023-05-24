import { Event } from './Event';
import { ExternalSystem } from './ExternalSystem';

class SomethingHappenedEvent extends Event {
  public constructor(id: string) {
    super(id);
  }
  getType(): string {
    return 'SomethingHappened';
  }
}
class SomeExternalSystem extends ExternalSystem {
  public doSomething(): void {
    this.applyChange(new SomethingHappenedEvent('123'));
  }
}

describe('ExternalSystem', () => {
  describe('getUncommittedChanges', () => {
    it('should return the list of events that have not been marked as committed', () => {
      const someExternalSystem = new SomeExternalSystem();
      someExternalSystem.doSomething();
      expect(someExternalSystem.getUncommittedChanges().length).toBe(1);
      const event = someExternalSystem.getUncommittedChanges()[0];
      expect(event instanceof SomethingHappenedEvent).toBe(true);
    });
    it('should not return events that have been marked as committed', () => {
      const someExternalSystem = new SomeExternalSystem();
      someExternalSystem.doSomething();
      someExternalSystem.markChangesAsCommitted();
      expect(someExternalSystem.getUncommittedChanges().length).toBe(0);
    });
  });
});
