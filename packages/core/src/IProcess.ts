import { Message } from './Message';

export interface IProcess {
  _handle(message: Message): void;
}
