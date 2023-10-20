import { Event } from './Event';
import { IEventHandler } from './IEventHandler';

export interface IPolicy extends IEventHandler {
  handle: (event: Event) => Promise<void>;
}
