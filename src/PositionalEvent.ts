import { Event } from './Event';

export interface PositionalEvent {
  streamId: string;
  position: bigint;
  revision: bigint;
  event?: Event;
  eventType: string;
}
