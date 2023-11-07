import { IEventStore } from './IEventStore';
import { IRepository } from './IRepository';
import { AggregateRoot } from './AggregateRoot';
import { logger } from '../../logger-console/src/Logger';

export class Repository<T extends AggregateRoot> implements IRepository<T> {
  constructor(private readonly _storage: IEventStore, private readonly Type: new (id: string) => T) {}

  private static getStreamNameFromType(T: { constructor: { name: string }; _id: string }): string {
    return Repository.getStreamName(T.constructor.name, T._id);
  }

  private static getStreamName(type: string, id: string): string {
    return `${type}-${id}`;
  }

  async save(T: AggregateRoot): Promise<void> {
    const streamName = Repository.getStreamNameFromType(T);
    logger.debug(
      'Repository:save saving to stream',
      streamName,
      ', the following events: ',
      T.getUncommittedChanges(),
      ', with version',
      T._version,
    );

    await this._storage.saveEvents(streamName, T.getUncommittedChanges(), T._version);
    T.markChangesAsCommitted();
  }

  async getById(id: string): Promise<T | undefined> {
    const domainObject = new this.Type(id);
    const streamName = Repository.getStreamName(domainObject.constructor.name, id);
    const history = await this._storage.getEvents(streamName);
    logger.debug('Repository:getById loading from stream', streamName, 'for aggregate', id);

    if (history.length == 0) {
      logger.debug('Repository:getById domain object not found');
      return undefined;
    }
    domainObject.loadFromHistory(history);
    logger.debug('Repository:getById loaded', domainObject);

    return domainObject;
  }
}
