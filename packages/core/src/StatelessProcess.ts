import { IProcess } from './IProcess';
import { Message } from './Message';

export abstract class StatelessProcess implements IProcess {
  _handle(message: Message): void {
    return this.handle(message);
  }

  protected abstract handle(message: Message): void;
}
