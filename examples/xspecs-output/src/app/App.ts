import 'reflect-metadata';
import { IEventStore, IMessageBus, MessageBus, Repository, EventUpcaster, IEventUpcaster } from '@ddk/core';
import { LocalEventStoreStore } from '@ddk/event-store-db';
// import { EntityManager } from '@mikro-orm/mysql';
import { Model } from '..';
import { AddInventoryItem } from '../domain';

export class App {
  public readonly messageBus: IMessageBus<unknown>;
  public readonly eventStore: IEventStore;
  public readonly eventUpcaster: IEventUpcaster;

  constructor() {
    // ## INFRASTRUCTURE
    this.messageBus = MessageBus.getInstance();
    this.eventUpcaster = new EventUpcaster();
    const host = 'esdb://localhost:2113?tls=false';
    this.eventStore = new LocalEventStoreStore('test', this.messageBus, host, this.eventUpcaster);

    // ## COMMAND HANDLERS
    this.messageBus.registerCommandHandlers(
      new Model.InventoryCommandHandlers(new Repository(this.eventStore, Model.Inventory)),
    );

    console.log('App started');
    this.messageBus.send(new AddInventoryItem('1234', 'item1', 'desc1', 100, 10)).then(() => {
      console.log('Inventory item added');
    });

    // ## POLICIES
  }
}
