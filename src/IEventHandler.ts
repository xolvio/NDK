import { Event } from './Event';

export interface EventHandlerArgsWithContext<Context> {
  event: Event;
  ctx: Context;
}

export interface EventHandlerArgs {
  event: Event;
}

export interface IEventHandler<Context> {
  handle: (eventHandlerArgs: EventHandlerArgs | EventHandlerArgsWithContext<Context>) => Promise<void>;
}
