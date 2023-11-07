import { AggregateRoot } from '@ddk/core';

export class Recipe extends AggregateRoot {
  constructor() {
    super('1');
  }
}
