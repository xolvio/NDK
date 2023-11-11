// @Entity from MikroORM
import { Event } from '@ddk/core';

export class RecipeModel {
  id: string;
  title: string;

  constructor({ id, title }: { id: string; title: string }) {
    this.id = id;
    this.title = title;
  }
}

export interface DataSource<T> {
  getById(id: string): T;
}

class FooEvent extends Event {
  constructor() {
    super('foo');
  }

  getType(): string {
    return '';
  }
}

class BarEvent extends Event {
  constructor() {
    super('foo');
  }

  getType(): string {
    return '';
  }
}

interface Projector {
  catchup(e: Event): void;
}

class SomeProjector implements Projector {
  catchup(e: FooEvent | BarEvent): void {
    // update read model logic
    // eslint-disable-next-line no-console
    console.log(e);
  }
}

class AnotherProjector implements Projector {
  catchup(e: FooEvent): void {
    // update read model logic
    // eslint-disable-next-line no-console
    console.log(e);
  }
}

new BarEvent();
new FooEvent();
new SomeProjector();
new AnotherProjector();

export class RecipeReadModel implements DataSource<RecipeModel>, Projector {
  getById(id: string): RecipeModel {
    // fetch from db
    return { id, title: 'hello' };
  }

  catchup(e: Event): void {
    // update read model logic
    // eslint-disable-next-line no-console
    console.log(e);
  }
}
