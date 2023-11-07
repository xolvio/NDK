import {
  AllStreamResolvedEvent,
  ANY,
  DeleteResult,
  EventStoreDBClient,
  FORWARDS,
  jsonEvent,
  NO_STREAM,
  ResolvedEvent,
  START,
  StreamingRead,
  StreamNotFoundError,
} from '@eventstore/db-client';
import { execSync } from 'child_process';
import {
  Event,
  IEventStore,
  IEventUpcaster,
  ILocalEventStore,
  IMessageBus,
  PositionalEvent,
  Serializer,
} from '@xspecs/ddk';
import { logger } from '@xspecs/logger';
import { WrongExpectedVersionError } from './WrongExpectedVersionError';

const serializer = new Serializer();

BigInt.prototype['toJSON'] = function () {
  return this.toString();
};

function destruct(input: string): { address: string; port: number }[] {
  const matches = input.match(/([\w.-]+:\d+)/g);
  if (!matches) return [];
  return matches.map((match) => {
    const [address, port] = match.split(':');
    return { address, port: parseInt(port, 10) };
  });
}

export class EventStoreStore implements IEventStore {
  private readonly messageBus: IMessageBus<any>;
  private readonly eventUpcaster: IEventUpcaster;

  private __client: EventStoreDBClient;
  // private readonly connectionSettings: {
  //   keepAliveInterval: number;
  //   endpoints: { address: string; port: number }[];
  //   keepAliveTimeout: number;
  //   defaultDeadline: number;
  //   maxDiscoverAttempts: number;
  //   gossipTimeout: number;
  //   throwOnAppendFailure: boolean;
  //   connectionName: string;
  //   discoveryInterval: number;
  // };
  // private readonly channelCredentials;
  private clientCount = 0;

  constructor(
    protected environment: string,
    messageBus: IMessageBus<unknown>,
    private readonly host: string,
    eventUpcaster: IEventUpcaster,
  ) {
    this.messageBus = messageBus;
    this.eventUpcaster = eventUpcaster;

    // this.connectionSettings = {
    //   endpoints: destruct(this.host),
    //   /**
    //    * How many times to attempt connection before throwing.
    //    */
    //   maxDiscoverAttempts: 2,
    //   /**
    //    * How long to wait before retrying (in milliseconds).
    //    */
    //   discoveryInterval: 100,
    //   /**
    //    * How long to wait for the request to time out (in seconds).
    //    */
    //   gossipTimeout: 1,
    //   /**
    //    * Preferred node type.
    //    */
    //   // nodePreference: NodePreference;
    //   /**
    //    * The amount of time (in milliseconds) to wait after which a keepalive ping is sent on the transport.
    //    * Use -1 to disable.
    //    * @default 10_000
    //    */
    //   keepAliveInterval: 10000,
    //   /**
    //    * The amount of time (in milliseconds) the sender of the keepalive ping waits for an acknowledgement.
    //    * If it does not receive an acknowledgement within this time, it will close the connection.
    //    * @default 10_000
    //    */
    //   keepAliveTimeout: 10000,
    //   /**
    //    * Whether to immediately throw an exception when an append fails.
    //    * @default true
    //    */
    //   throwOnAppendFailure: true,
    //   /**
    //    * An optional length of time (in milliseconds) to use for gRPC deadlines.
    //    * @default 10_000
    //    */
    //   defaultDeadline: 10000,
    //   /**
    //    * The name of the connection to use in logs.
    //    * @default uuid
    //    */
    //   connectionName: 'event-store-grpc-client',
    // };
    // this.channelCredentials = {
    //   insecure: true,
    // };
    // logger.debug(
    //   'EventStoreStore:client connectionSettings',
    //   this.connectionSettings,
    //   'channelCredentials',
    //   this.channelCredentials,
    // );
    logger.debug('EventStoreStore:client host', this.host);
  }

  protected client(): EventStoreDBClient {
    // host based settings
    logger.debug(`EventStoreStore:client - creating new client (${this.clientCount++})`);
    return EventStoreDBClient.connectionString`${this.host}`;

    // manual settings
    // logger.debug(`EventStoreStore:client - creating new client (${this.clientCount++})`);
    // return new EventStoreDBClient(this.connectionSettings, this.channelCredentials);

    // singleton
    // if (this.__client) return this.__client;
    // this.__client = new EventStoreDBClient(connectionSettings, channelCredentials);
    // return this.__client;
  }

  async dispose(): Promise<void> {
    if (this.__client) await this.__client.dispose();
  }

  async saveEvents(streamName: string, events: Event[], expectedVersion?: bigint, publish = true): Promise<void> {
    const wrappedEvents = events.map((event) => {
      return jsonEvent({
        type: event.getType(),
        data: serializer.serialize(event),
        metadata: { class: event.constructor.name },
      });
    });
    let client;
    try {
      const expected = expectedVersion === BigInt(-1) ? NO_STREAM : expectedVersion?.valueOf() ?? ANY;
      logger.debug(
        'EventStoreStore:saveEvents - appending to stream',
        this.getStreamName(streamName),
        'events: ',
        events,
      );
      client = this.client();
      await client.appendToStream(this.getStreamName(streamName), wrappedEvents, {
        expectedRevision: expected,
      });
      if (publish) {
        for await (const event of events) {
          await this.messageBus.publish(event);
        }
      }
    } catch (e) {
      throw e.type === 'wrong-expected-version' ? new WrongExpectedVersionError() : e;
    } finally {
      await client.dispose();
      logger.debug('disposed', client.connectionName);
    }
  }

  protected getStreamName(streamName: string): string {
    let prefix: string;
    if (process.env.STREAM_PREFIX) prefix = process.env.STREAM_PREFIX;
    else prefix = this.environment;
    return `${prefix}-${streamName}`;
  }

  protected getStreamFilter(): string {
    const EMPTY = '';
    return this.getStreamName(EMPTY);
  }

  async getEvents(streamName: string): Promise<PositionalEvent[]> {
    logger.debug('EventStoreStore:getEvents - getting events for stream', this.getStreamName(streamName));
    const events: PositionalEvent[] = [];
    let eventsStream: StreamingRead<ResolvedEvent>;
    let client;
    try {
      client = this.client();
      eventsStream = client.readStream(this.getStreamName(streamName), {
        fromRevision: START,
        direction: FORWARDS,
      });
      const events: PositionalEvent[] = [];

      for await (const { event } of eventsStream) {
        if (
          event === undefined ||
          event.metadata === undefined ||
          (event.metadata as { class: string }).class === undefined ||
          event.position === undefined
        ) {
          continue;
        }
        events.push(this.transformEvent(event));
      }
      logger.debug(
        'EventStoreStore:getEvents - got events for stream',
        this.getStreamName(streamName),
        JSON.stringify(events, null, 2),
      );
      return events;
    } catch (error) {
      if (error instanceof StreamNotFoundError) {
        return events;
      }
      logger.error('EventStoreStore:getEvents - error getting events: ', error);
      throw error;
    } finally {
      if (eventsStream) {
        eventsStream.destroy();
      }
      await client.dispose();
      logger.debug('disposed', client.connectionName);
    }
  }

  async getAllEvents(
    from?: bigint,
    chunkSize?: number,
    streamNameFilter?: string | RegExp,
    client: EventStoreDBClient = this.client(),
  ): Promise<PositionalEvent[]> {
    let options;
    if (from != null) {
      options = {
        direction: FORWARDS,
        fromPosition: {
          commit: from,
          prepare: from,
          maxCount: chunkSize,
        },
      };
    } else {
      options = {
        direction: FORWARDS,
        fromPosition: START,
      };
    }
    logger.debug(`EventStoreStore:getAllEvents - calling readAll with ${JSON.stringify(options, null, 2)}`);
    let eventStream: StreamingRead<AllStreamResolvedEvent>;
    try {
      eventStream = client.readAll(options);
      const positionalEvents: PositionalEvent[] = [];
      if (typeof streamNameFilter === 'string') {
        streamNameFilter = new RegExp(this.escapeRegExp(streamNameFilter));
      }
      for await (const { event, commitPosition } of eventStream) {
        if (event == null) {
          continue;
        }
        if (event.type.startsWith('$')) {
          continue;
        }
        if (commitPosition === undefined || event.metadata === undefined) {
          continue;
        }
        if (!event.streamId.startsWith(this.getStreamFilter())) {
          continue;
        }
        if (streamNameFilter && !event.streamId.match(streamNameFilter)) {
          continue;
        }
        positionalEvents.push(this.transformEvent(event));
      }

      if (positionalEvents.length >= 50) {
        logger.debug(
          `EventStoreStore:getAllEvents - streamFilter=${this.getStreamFilter()}, filtered positionalEvents`,
          JSON.stringify(positionalEvents, null, 2),
        );
      } else {
        logger.debug(
          `EventStoreStore:getAllEvents - streamFilter=${this.getStreamFilter()}, filtered positionalEvents for ${
            positionalEvents.length
          } events`,
        );
      }
      return positionalEvents;
    } catch (error) {
      logger.error('EventStoreStore:getAllEvents - error saving events: ', error);
      throw error;
    } finally {
      if (eventStream) {
        eventStream.destroy();
      }
      await client.dispose();
      logger.debug('disposed', client.connectionName);
    }
  }

  async transferEvents(sourceConnectionString: string, fromPosition: bigint, chunkSize: number): Promise<bigint> {
    const sourceClient = EventStoreDBClient.connectionString`${sourceConnectionString}`;
    let lastEventNumber = fromPosition;
    try {
      const events: PositionalEvent[] = await this.getAllEvents(fromPosition, chunkSize, undefined, sourceClient);
      for (const positionalEvent of events) {
        await this.saveEvents(positionalEvent.streamId, [positionalEvent.event]);
        lastEventNumber = positionalEvent.position;
      }
      return lastEventNumber > fromPosition ? lastEventNumber : undefined;
    } catch (e) {
      logger.error(`EventStoreStore:transferEvents - error transferring events`, e);
      return lastEventNumber;
    } finally {
      await sourceClient.dispose();
      logger.debug('disposed', sourceClient.connectionName);
    }
  }

  private escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
  }

  private transformEvent(event): PositionalEvent {
    let eventType = (event.metadata as { class: string }).class;
    let eventInstance;
    if (this.eventUpcaster.hasUpcaster(eventType)) {
      eventInstance = this.eventUpcaster.upcast(event.data, eventType);
      eventType = eventInstance.constructor.name;
    } else {
      eventInstance = serializer.deserialize(event.data, eventType);
    }
    if (!eventInstance) {
      logger.warn(
        `Event ${eventType} does not exist. Consider registering an EventUpcaster`,
        JSON.stringify(event, null, 2),
      );
    }
    return {
      streamId: event.streamId,
      event: eventInstance,
      revision: event.revision,
      position: event.position.commit,
      eventType: eventType,
    };
  }
}

export class LocalEventStoreStore extends EventStoreStore implements ILocalEventStore {
  private readonly streamsCreated = {};

  private readonly initialEnvironment: string;

  constructor(environment: string, messageBus: IMessageBus<unknown>, host: string, eventUpcaster: IEventUpcaster) {
    super(LocalEventStoreStore.getEnvironmentName(environment), messageBus, host, eventUpcaster);
    this.initialEnvironment = environment;
  }

  static getEnvironmentName(prefix: string): string {
    if (process.env.NODE_ENV === 'test') return `${prefix}-` + (Math.random() + 1).toString(36).substring(7);
    return prefix;
  }

  async reset(): Promise<void> {
    const tombstonePromises: Array<Promise<DeleteResult>> = [];
    const disposePromises: Array<Promise<void>> = [];
    for (const [stream] of Object.entries(this.streamsCreated)) {
      const client = this.client();
      tombstonePromises.push(client.tombstoneStream(stream));
      disposePromises.push(client.dispose());
    }
    await Promise.allSettled(tombstonePromises);
    await Promise.allSettled(disposePromises);
    this.environment = LocalEventStoreStore.getEnvironmentName(this.initialEnvironment);
  }

  async saveEvents(streamName: string, events: Event[], expectedVersion?: bigint): Promise<void> {
    this.streamsCreated[this.getStreamName(streamName)] = expectedVersion;
    return await super.saveEvents(streamName, events, expectedVersion);
  }

  async saveEvent(streamName: string, eventName: string, data, expectedVersion?: bigint) {
    const event = jsonEvent({
      type: eventName,
      data: data,
      metadata: { class: eventName },
    });

    let client;
    try {
      const expected = expectedVersion === BigInt(-1) ? NO_STREAM : expectedVersion?.valueOf() ?? ANY;
      client = this.client();
      await client.appendToStream(this.getStreamName(streamName), [event], {
        expectedRevision: expected,
      });
    } catch (e) {
      logger.error(`EventStoreStore:saveEvent - error: `, e);
      throw e.type === 'wrong-expected-version' ? new WrongExpectedVersionError() : e;
    } finally {
      await client.dispose();
      logger.debug('disposed', client.connectionName);
    }
  }

  restart(): void {
    execSync(`yarn restart > /dev/null 2>&1`, {
      // stdio: "inherit"
    });
    execSync(
      `while [[ "$(curl -s -o /dev/null -w ''%{http_code}'' localhost:2113)" != "302" ]]; do printf .; sleep .1; done`,
      {
        // stdio: "inherit",
      },
    );
  }
}
