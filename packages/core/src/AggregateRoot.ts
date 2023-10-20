import { Event } from './Event';
import { PositionalEvent } from './PositionalEvent';

export abstract class AggregateRoot {
  public get _id(): string {
    return this.__id;
  }
  protected __id: string;
  private error?: string;
  private readonly _changes: Event[] = [];
  public _version = BigInt(-1);

  public constructor(id: string) {
    this.__id = id;
  }

  public getUncommittedChanges(): Event[] {
    return this._changes;
  }

  protected applyError(error: string): boolean {
    this.error = error;
    return false;
  }

  public getError(): string | undefined {
    return this.error;
  }

  markChangesAsCommitted(): void {
    this._changes.length = 0;
  }

  loadFromHistory(history: PositionalEvent[]): void {
    history.forEach((e) => {
      if (e.event) {
        this.applyChangeInternal(e.event);
      }
      this._version = e.revision;
    });
  }

  protected applyChange(event: Event): boolean {
    this.applyChangeInternal(event, true);
    return true;
  }

  private applyChangeInternal(event: Event, isNew = false): void {
    // @ts-ignore
    if (this[`apply${event.constructor.name}`] === undefined) {
      throw new Error(
        `No handler found for ${event.constructor.name}. Be sure to define a method called apply${event.constructor.name} on the aggregate.`,
      );
    }
    // @ts-ignore
    this[`apply${event.constructor.name}`](event);

    if (isNew) {
      this._changes.push(event);
    }
  }
}
