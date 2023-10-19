import { Event } from './Event';

export abstract class ExternalSystem {
  private readonly _changes: Event[] = [];
  private error?: string;

  public getUncommittedChanges(): Event[] {
    return this._changes;
  }

  markChangesAsCommitted(): void {
    this._changes.length = 0;
  }

  protected applyChange(event: Event): boolean {
    this._changes.push(event);
    return true;
  }

  protected applyError(error: string): boolean {
    this.error = error;
    return false;
  }

  public getError(): string | undefined {
    return this.error;
  }
}
