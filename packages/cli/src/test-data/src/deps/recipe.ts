import { AggregateRoot } from '@ddk/core';

export class Recipe extends AggregateRoot {
  constructor(aggregateId: string) {
    super(aggregateId);
  }

  add(): boolean {
    //
  }
}
