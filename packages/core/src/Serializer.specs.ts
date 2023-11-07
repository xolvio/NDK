import { Serializable, Serializer } from './Serializer';
import { logger } from '../../logger-console/src/Logger';

class Foo {
  foo = '';
}

describe('Serializer', () => {
  describe('Serializable decorator', () => {
    it('should register decorated classes as types', () => {
      @Serializable
      class MyClass {
        constructor(public readonly name: string) {}
      }

      const myClass = new Serializer().deserialize<MyClass>({ name: 'hey!' }, 'MyClass');

      if (myClass === null) throw new Error('myClass is null');

      expect(myClass instanceof MyClass).toEqual(true);
      expect(myClass.name).toEqual('hey!');
    });
  });
  describe('serialize & deserialize', () => {
    it('should serialize an object', async () => {
      class Foo {
        constructor(public readonly name: string) {}
      }

      const f = new Foo('bar');
      const serializer = new Serializer();
      const serialized = serializer.serialize(f);
      expect(serialized).toEqual({ name: 'bar' });
    });
    it('should deserialize known types', () => {
      const serializer = new Serializer();
      serializer.registerType<Foo>(Foo);
      const data = { foo: 'bar' };

      const result = serializer.deserialize(data, 'Foo');

      expect(result instanceof Foo).toEqual(true);
      expect(result).toEqual(data);
    });
    it('should return null when an object cannot be serialized', function () {
      logger.warn = jest.fn(); // disable console.warn for this test
      const result = new Serializer().deserialize({ bar: 'baz' }, 'bar');

      expect(result).toEqual(null);
    });
  });
});
