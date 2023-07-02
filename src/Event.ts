import { Message } from './Message';

export abstract class Event extends Message {
  protected constructor(public readonly aggregateId?: string) {
    super();
  }

  abstract getType(): string;
}
