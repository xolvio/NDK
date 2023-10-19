import { Event } from './Event';
import { IEventHandler } from './IEventHandler';

export interface ISaga extends IEventHandler {
  handle: (event: Event) => Promise<void>;
}
