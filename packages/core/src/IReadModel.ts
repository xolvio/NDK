import { Event } from './Event';
import { IEventHandler } from './IEventHandler';

export interface IReadModel<DB> extends IEventHandler {
  handle: (event: Event, db: DB) => Promise<void>;
}
