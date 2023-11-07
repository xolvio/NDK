import {
  After,
  AfterAll,
  Before,
  setDefaultTimeout,
  setWorldConstructor,
  World as BaseWorld,
} from '@cucumber/cucumber';
import expect from 'expect';
import { ILocalEventStore, IMessageBus } from '@ddk/core';
import { App } from '../../src/app';

// Put the expect library on the global this context so step defs can access it without having ot define it
Object.defineProperty(globalThis, 'expect', { value: expect });
setDefaultTimeout(60 * 1000);
process.env.NODE_ENV = 'test'; // Let the app know we are running in test mode

// World docs: https://github.com/cucumber/cucumber-js/blob/main/docs/support_files/world.md
export class World extends BaseWorld {
  // @ts-ignore
  messageBus: IMessageBus<unknown>;
  // @ts-ignore
  eventStore: ILocalEventStore;

  async init(): Promise<void> {
    const app = new App();
    this.messageBus = app.messageBus;
    this.eventStore = app.eventStore as ILocalEventStore;
  }
}

setWorldConstructor(World);

// Hooks docs: https://cucumber.io/docs/cucumber/api/?lang=javascript#hooks
// runs before the first step of each scenario.
Before(async function (this: World) {
  await this.eventStore.reset();
});

// runs after the last step of each scenario, even when the step result is failed, undefined, pending, or skipped
After(async function (/*scenario*/) {
  // do nothing
});

// runs after all scenarios have been executed
AfterAll(async function (this: World) {
  await this.eventStore.dispose();
});
