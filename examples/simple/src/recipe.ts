import { AggregateRoot } from '@ddk/core';

export class Recipe extends AggregateRoot {
  add(): boolean {
    return false;
  }
  delete(): boolean {
    return false;
  }
}
