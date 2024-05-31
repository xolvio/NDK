// @ts-nocheck
import * as td from 'testdouble';
import { MemoryStore } from './MemoryStore';
import { Event, EventUpcaster, IMessageBus, Serializable } from '@ddk/core';
import { LocalEventStoreStore } from './EventStoreStore';
import { execSync } from 'child_process';
import { logger } from '@ddk/logger';

@Serializable
class DummyEvent extends Event {
  constructor(id: string, private readonly blah: string) {
    super(id + blah);
  }

  getType(): string {
    return 'dummy';
  }
}

const messageBus = td.object<IMessageBus<unknown>>();
const host = process?.env.EVENT_STORE_URL ?? 'esdb://localhost:2113?tls=false';
const eventStoreClass = LocalEventStoreStore;

function restartEventStore() {
  try {
    execSync('lerna run servers:restart:eventstore --scope=@xspecs/core > /dev/null 2>&1', {
      // stdio: 'inherit',
    });
  } catch (e) {
    // do nothing
  }
}

let eventStore;
let eventUpcaster;
describe(`${eventStoreClass.name}`, () => {
  beforeEach(async () => {
    eventUpcaster = new EventUpcaster();
    if (eventStoreClass.name === 'MemoryStore') eventStore = new MemoryStore('test', messageBus);
    if (eventStoreClass.name === 'LocalEventStoreStore')
      eventStore = new LocalEventStoreStore('test', messageBus, host, eventUpcaster);
    await eventStore.reset();
  });
  afterAll(async () => {
    await eventStore.dispose();
    if (eventStoreClass.name === 'LocalEventStoreStore') restartEventStore();
  });
  describe('saveEvents', () => {
    it('should save and publish multiple events', async () => {
      const event1 = new DummyEvent('1234', 'dummy');
      const event2 = new DummyEvent('4567', 'dummy');

      await eventStore.saveEvents('my-stream', [event1, event2], BigInt(-1));

      await td.verify(messageBus.publish(event1));
      await td.verify(messageBus.publish(event2));
    });
    it('should store events when a version number is not provided for a new stream', async () => {
      const event = new DummyEvent('1234', 'dummy');

      await eventStore.saveEvents('my-stream', [event]);

      const events = await eventStore.getEvents('my-stream');
      expect(events[0].event).toEqual(event);
    });
    it('should store events when a version number is not provided for an existing new stream', async () => {
      const event1 = new DummyEvent('1234', 'dummy');
      const event2 = new DummyEvent('1234', 'dummy');

      await eventStore.saveEvents('my-stream', [event1]);
      await eventStore.saveEvents('my-stream', [event2]);

      const events = await eventStore.getEvents('my-stream');
      expect(events[0].event).toEqual(event1);
      expect(events[1].event).toEqual(event2);
    });
    it('should not throw when a sequential version number is provided', async () => {
      const event1 = new DummyEvent('12', 'dummy');
      const event2 = new DummyEvent('34', 'dummy');
      const event3 = new DummyEvent('56', 'dummy');
      const event4 = new DummyEvent('78', 'dummy');

      await eventStore.saveEvents('some-stream', [event1], BigInt(-1));
      await eventStore.saveEvents('some-stream', [event2, event3], BigInt(0));
      await eventStore.saveEvents('some-stream', [event4], BigInt(2));
    });
    it('should not store an event if the version number is not as expected', async () => {
      const event = new DummyEvent('1234', 'dummy');
      await eventStore.saveEvents('my-stream', [event], BigInt(-1));
      await eventStore.saveEvents('my-stream', [event], BigInt(0));

      await expect(async () => {
        await eventStore.saveEvents('my-stream', [event], BigInt(0));
      }).rejects.toThrow('Wrong expected version');
    });
    it('should store a global position of events', async function () {
      const event1 = new DummyEvent('123', 'dummy');
      const event2 = new DummyEvent('456', 'dummy');
      const event3 = new DummyEvent('789', 'dummy');

      await eventStore.saveEvents('my-stream1', [event1]);
      await eventStore.saveEvents('my-stream2', [event2]);
      await eventStore.saveEvents('my-stream1', [event3]);

      const allEvents = await eventStore.getAllEvents();

      expect(allEvents[0].event.aggregateId).toBe(event1.aggregateId);
      expect(allEvents[1].event.aggregateId).toBe(event2.aggregateId);
      expect(allEvents[2].event.aggregateId).toBe(event3.aggregateId);
      expect(Number(allEvents[0].position)).toBeLessThan(Number(allEvents[1].position));
      expect(Number(allEvents[1].position)).toBeLessThan(Number(allEvents[2].position));
    });
    it('should increase the revision number per stream', async function () {
      const event1 = new DummyEvent('123', 'dummy');
      const event2 = new DummyEvent('456', 'dummy');
      const event3 = new DummyEvent('789', 'dummy');

      await eventStore.saveEvents('my-stream1', [event1]);
      await eventStore.saveEvents('my-stream2', [event2]);
      await eventStore.saveEvents('my-stream1', [event3]);

      const stream1Events = await eventStore.getEvents('my-stream1');
      const stream2Events = await eventStore.getEvents('my-stream2');

      expect(Number(stream1Events[1].revision)).toBeGreaterThan(Number(stream1Events[0].revision));
      expect(Number(stream1Events[0].revision)).toEqual(Number(stream2Events[0].revision));
    });
  });
  describe('getEvents', () => {
    it('should return all the events for a given stream', async () => {
      const event1 = new DummyEvent('1234', 'dummy');
      const event2 = new DummyEvent('4567', 'dummy');
      const event3 = new DummyEvent('7891', 'dummy');

      await eventStore.saveEvents('my-stream', [event1, event2], BigInt(-1));
      await eventStore.saveEvents('my-stream', [event3], BigInt(1));

      const events = await eventStore.getEvents('my-stream');
      expect(events[0].event).toEqual(event1);
      expect(events[1].event).toEqual(event2);
      expect(events[2].event).toEqual(event3);
    });
    it(`should return upcasted deprecated events`, async () => {
      eventUpcaster.registerDeprecatedEvent('OldDummyEvent', 'DummyEvent');
      await eventStore.saveEvent('my-stream', 'OldDummyEvent', 'id:1', BigInt(-1));

      const events = await eventStore.getEvents('my-stream');

      expect(events[0].eventType).toEqual('DummyEvent');
      expect(events[0].revision).toEqual(0n);
    });

    it(`should return deleted events for a given stream`, async () => {
      await eventStore.saveEvent('my-stream', 'non-existent event store', 'id:1', BigInt(-1));
      await eventStore.saveEvents('my-stream', [new DummyEvent('1', 'blah')]);

      logger.warn = jest.fn(); // disable console.warn for this test
      const events = await eventStore.getEvents('my-stream');

      expect(events[0].eventType).toEqual('non-existent event store');
      expect(events[0].revision).toEqual(0n);
    });
  });
  describe('getAllEvents', () => {
    it('should return all events from all streams in the order they were committed', async () => {
      const event1 = new DummyEvent('1234', 'dummy');
      const event2 = new DummyEvent('4567', 'dummy');
      const event3 = new DummyEvent('7891', 'dummy');

      await eventStore.saveEvents('my-stream', [event1, event2, event3], BigInt(-1));

      const events = await eventStore.getAllEvents();
      expect(events[0].event).toEqual(event1);
      expect(events[1].event).toEqual(event2);
      expect(events[2].event).toEqual(event3);
      expect(events[0].position).toBeLessThan(parseInt(events[1].position.toString()));
      expect(events[1].position).toBeLessThan(parseInt(events[2].position.toString()));
    }, 7000);
    it('should return events from a specific commit point in time', async () => {
      const event1 = new DummyEvent('12', 'dummy');
      const event2 = new DummyEvent('34', 'dummy');
      const event3 = new DummyEvent('45', 'dummy');
      const event4 = new DummyEvent('78', 'dummy');
      const event5 = new DummyEvent('91', 'dummy');

      await eventStore.saveEvents('my-stream', [event1, event2, event3, event4, event5], BigInt(-1));
      let events = await eventStore.getAllEvents();
      const position = events[3].position;
      events = await eventStore.getAllEvents(position);

      expect(events[0].event).toEqual(event4);
      expect(events[1].event).toEqual(event5);
    });
  });
});
