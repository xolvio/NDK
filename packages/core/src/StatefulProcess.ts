import { IProcess } from './IProcess';
import { Message } from './Message';

enum Transition {
  TERMINATE = 'TERMINATE',
  CONTINUE = 'CONTINUE',
}

enum State {
  TERMINATED = 'TERMINATED',
  STARTED = 'STARTED',
  NOT_STARTED = 'NOT_STARTED',
}

export abstract class StatefulProcess implements IProcess {
  private state: State = State.NOT_STARTED;

  protected static TERMINATE = Transition.TERMINATE;
  protected static CONTINUE = Transition.CONTINUE;

  _handle(message: Message): void {
    if (this.state === State.TERMINATED) throw new Error('Process has already been completed.');
    this.state = State.STARTED;
    if (this.handle(message) === Transition.TERMINATE) this.terminate();
  }

  protected abstract handle(message: Message): Transition;

  private terminate(): void {
    this.state = State.TERMINATED;
  }
}
