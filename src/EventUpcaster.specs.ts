import { EventUpcaster } from './EventUpcaster';
import { Serializable } from './Serializer';
import { Event } from './Event';

@Serializable
export class NewEvent extends Event {
  constructor(public readonly aggregateId: string, public readonly newId: string) {
    super(aggregateId);
  }

  getType(): string {
    return 'NewEvent';
  }
}

describe('EventUpcaster', () => {
  describe('canUpcast', () => {
    it('should return true when a  given event type is registered', () => {
      const eventUpcaster = new EventUpcaster();
      eventUpcaster.registerDeprecatedEvent('OldEvent', NewEvent.name);
      expect(eventUpcaster.hasUpcaster('OldEvent')).toBe(true);
    });
    it('should return false when a given event type is not registered', () => {
      const eventUpcaster = new EventUpcaster();
      eventUpcaster.registerDeprecatedEvent('OldEvent', NewEvent.name);
      expect(eventUpcaster.hasUpcaster('DocCreatedEvent')).toBe(false);
    });
  });
  describe('upcast', () => {
    it('should upcast a registered deprecated event to a new replacement event', () => {
      const eventData = { aggregateId: 'd5529ca9-bda5-4223-9522-b817ec6a4963', oldId: '1234' };
      const eventUpcaster = new EventUpcaster();
      eventUpcaster.registerDeprecatedEvent('OldEvent', NewEvent.name);

      const newEvent = eventUpcaster.upcast(eventData, 'OldEvent');

      expect(newEvent).toBeInstanceOf(NewEvent);
      expect(newEvent?.aggregateId).toBe('d5529ca9-bda5-4223-9522-b817ec6a4963');
      expect((<NewEvent>newEvent).newId).toBe(undefined);
    });
    it('should upcast and replace properties of a deprecated event', () => {
      const eventData = { aggregateId: 'd5529ca9-bda5-4223-9522-b817ec6a4963', oldId: '1234' };
      const eventUpcaster = new EventUpcaster();
      eventUpcaster
        .registerDeprecatedEvent('OldEvent', NewEvent.name)
        .withReplacePropertiesUpcast([{ from: 'oldId', to: 'newId' }]);

      const newEvent = eventUpcaster.upcast(eventData, 'OldEvent');

      expect(newEvent).toBeInstanceOf(NewEvent);
      expect(newEvent?.aggregateId).toBe('d5529ca9-bda5-4223-9522-b817ec6a4963');
      expect((<NewEvent>newEvent).newId).toBe('1234');
      // @ts-ignore
      expect(newEvent['OldId']).toBeUndefined();
    });
    it('should upcast and clone properties of a deprecated event', () => {
      const eventData = { aggregateId: 'd5529ca9-bda5-4223-9522-b817ec6a4963', oldId: '1234' };
      const eventUpcaster = new EventUpcaster();
      eventUpcaster
        .registerDeprecatedEvent('OldEvent', NewEvent.name)
        .withClonePropertiesUpcast([{ from: 'aggregateId', to: 'newId' }]);

      const newEvent = eventUpcaster.upcast(eventData, 'OldEvent');

      expect(newEvent).toBeInstanceOf(NewEvent);
      expect(newEvent?.aggregateId).toBe('d5529ca9-bda5-4223-9522-b817ec6a4963');
      expect((<NewEvent>newEvent).newId).toBe('d5529ca9-bda5-4223-9522-b817ec6a4963');
    });
    it('should upcast and copy property values of a deprecated event', () => {
      const eventData = { aggregateId: 'd5529ca9-bda5-4223-9522-b817ec6a4963', oldId: '1234' };
      const eventUpcaster = new EventUpcaster();
      eventUpcaster
        .registerDeprecatedEvent('OldEvent', NewEvent.name)
        .withClonePropertiesUpcast([{ from: 'aggregateId', to: 'newId' }])
        .withCopyPropertyValuesUpcast([{ from: 'oldId', to: 'aggregateId' }]);

      const newEvent = eventUpcaster.upcast(eventData, 'OldEvent');

      expect(newEvent).toBeInstanceOf(NewEvent);
      expect(newEvent?.aggregateId).toBe('1234');
      expect((<NewEvent>newEvent).newId).toBe('d5529ca9-bda5-4223-9522-b817ec6a4963');
    });
    it('should return null when the upcast is ....', async () => {
      const eventUpcaster = new EventUpcaster();
      const x = eventUpcaster.upcast({}, '');
      expect(x).toBeNull();
    });
    it('should throw an error when a deprecated event type is not registered', async () => {
      expect(() => {
        new EventUpcaster().withReplacePropertiesUpcast([{ from: 'foo', to: 'bar' }]);
      }).toThrow('No deprecated event type registered');
      expect(() => {
        new EventUpcaster().withClonePropertiesUpcast([{ from: 'foo', to: 'bar' }]);
      }).toThrow('No deprecated event type registered');
      expect(() => {
        new EventUpcaster().withCopyPropertyValuesUpcast([{ from: 'foo', to: 'bar' }]);
      }).toThrow('No deprecated event type registered');
    });
  });
});
