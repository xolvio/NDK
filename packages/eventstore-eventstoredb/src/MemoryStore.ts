// @ts-nocheck
import { Event, ILocalEventStore, IMessageBus, PositionalEvent } from '@ddk/core';
import { logger } from '@ddk/logger';
import { WrongExpectedVersionError } from './WrongExpectedVersionError';

export class MemoryStore implements ILocalEventStore {
  private readonly _messageBus;
  private _expectedRevisions = {};
  protected events: { [streamName: string]: PositionalEvent[] } = {};
  private commitPosition = BigInt(0);

  constructor(environment: string, messageBus: IMessageBus<unknown>) {
    this._messageBus = messageBus;
    logger.debug(`MemoryStore: created`, environment);
  }

  public async reset(): Promise<void> {
    return await new Promise((resolve) => {
      this.events = {};
      this._expectedRevisions = {};
      this.commitPosition = BigInt(0);
      resolve();
    });
  }

  public restart(): void {
    // do nothing
  }

  private async __saveEvents(streamName: string, events: Event[]): Promise<void> {
    const toPublish: Event[] = [];
    return await new Promise((resolve) => {
      try {
        events.forEach((e) => {
          this._expectedRevisions[streamName]++;
          this.commitPosition++;
          const pe: PositionalEvent = {
            streamId: streamName,
            event: e,
            revision: this._expectedRevisions[streamName],
            position: this.commitPosition,
            eventType: e.getType(),
          };
          this.events[streamName].push(pe);
          toPublish.push(e);
        });
      } catch (e) {
        logger.error(e);
      } finally {
        const promises = toPublish.map((e) => this._messageBus.publish(e));
        Promise.allSettled(promises)
          .then(() => resolve())
          .catch((e) => logger.error(e));
      }
    });
  }

  public async saveEvents(streamName: string, events: Event[], expectedVersion?: bigint): Promise<void> {
    if (expectedVersion === undefined && this._expectedRevisions[streamName] === undefined) {
      this._expectedRevisions[streamName] = BigInt(-1);
      this.events[streamName] = [];
      await this.__saveEvents(streamName, events);
      return;
    }

    if (expectedVersion === undefined) {
      await this.__saveEvents(streamName, events);
      return;
    }

    if (this._expectedRevisions[streamName] === undefined && expectedVersion === BigInt(-1)) {
      this._expectedRevisions[streamName] = BigInt(-1);
      this.events[streamName] = [];
      await this.__saveEvents(streamName, events);
      return;
    }
    if (this._expectedRevisions[streamName] !== undefined && expectedVersion === BigInt(-1)) {
      throw new WrongExpectedVersionError();
    }
    if (expectedVersion !== this._expectedRevisions[streamName]) {
      throw new WrongExpectedVersionError();
    }

    await this.__saveEvents(streamName, events);
  }

  public async getEvents(streamName: string): Promise<PositionalEvent[]> {
    return this.events[streamName] ?? [];
  }

  public async getAllEvents(from?: bigint): Promise<PositionalEvent[]> {
    const flat: PositionalEvent[] = [];
    for (const [, arr] of Object.entries(this.events)) {
      flat.push(...arr);
    }
    return flat
      .sort((a: PositionalEvent, b: PositionalEvent) => Number(a.position) - Number(b.position))
      .slice(Number(from) - 1 ?? 0);
  }

  async transferEvents(sourceConnectionString: string, fromPosition: bigint, chunkSize: number): Promise<bigint> {
    return await Promise.resolve(BigInt(0));
  }

  async dispose(): Promise<void> {
    return await Promise.resolve(undefined);
  }
}
