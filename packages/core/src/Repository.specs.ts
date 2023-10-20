import { AggregateRoot } from './AggregateRoot';
import { Repository } from './Repository';
import td from 'testdouble';
import { Event, IEventStore } from '.';

class CreatedEvent extends Event {
  constructor(public readonly id: string) {
    super(id);
  }

  getType(): string {
    return '';
  }
}

class Agg extends AggregateRoot {
  ids: string[] = [];

  applyCreatedEvent(event: CreatedEvent) {
    this.ids.push(event.id);
  }
}

describe('Repository', () => {
  describe('save', () => {
    it('should save the uncommitted events from an aggregate stream', () => {
      const eventStore = td.object<IEventStore>();
      const repository = new Repository(eventStore, Agg);

      const agg = new Agg('123');
      repository.save(agg);

      td.verify(eventStore.saveEvents('Agg-123', [], BigInt(-1)));
    });
  });
  describe('getById', () => {
    it('should rehydrate an aggregate with the correct type', async () => {
      const eventStore = td.object<IEventStore>();
      td.when(eventStore.getEvents('Agg-123')).thenResolve([
        {
          position: BigInt(-1),
          revision: BigInt(-1),
          streamId: 'Agg-123',
          event: new CreatedEvent('456'),
          eventType: 'CreatedEvent',
        },
      ]);
      const repository = new Repository(eventStore, Agg);

      const agg = await repository.getById('123');

      expect(agg).toBeInstanceOf(Agg);
      expect(agg?.ids[0]).toEqual('456');
    });
    it('should return undefined if no events exist for an aggregate', async () => {
      const eventStore = td.object<IEventStore>();
      td.when(eventStore.getEvents('Agg-123')).thenResolve([]);
      const repository = new Repository(eventStore, Agg);

      const agg = await repository.getById('123');

      expect(agg).toBe(undefined);
    });
  });
});
