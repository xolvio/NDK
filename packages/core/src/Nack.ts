import { NackErrors } from './NackErrors';

export class Nack {
  constructor(public readonly errorCode: NackErrors) {}
}
