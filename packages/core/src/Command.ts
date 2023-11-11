import { Message } from './Message';

export abstract class Command extends Message {
  protected constructor() {
    super();
  }
}
