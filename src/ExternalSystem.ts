import { Event } from './Event';

export abstract class ExternalSystem {
  private readonly _changes: Event[] = [];

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
}
