import { AggregateRoot } from './AggregateRoot';

export interface IRepository<T extends AggregateRoot> {
  save(T: AggregateRoot): Promise<void>;

  getById: (id: string) => Promise<T | undefined>;
}
