import { Event } from './Event';
import { PositionalEvent } from './PositionalEvent';

export interface IEventStore {
  saveEvents: (streamName: string, events: Event[], expectedRevision?: bigint) => Promise<void>;

  getEvents: (streamName: string) => Promise<PositionalEvent[]>;

  getAllEvents: (from?: bigint) => Promise<PositionalEvent[]>;
}

export interface ILocalEventStore extends IEventStore {
  reset: () => Promise<void>;
  dispose: () => Promise<void>;
}
