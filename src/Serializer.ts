import { logger } from './Logger';

declare let global: {
  ___serializerTypes: { [key: string]: object };
};

export class Serializer {
  constructor() {
    if (global.___serializerTypes === undefined) global.___serializerTypes = {};
  }

  registerType<T>(type: { new (...args: T[]): T }): void {
    global.___serializerTypes[type.name] = type.prototype;
  }

  serialize(obj: object): Record<string, number | string> | string {
    return structuredClone(obj) as Record<string, number | string> | string;
  }

  deserialize<T>(data: object, type: string): T | null {
    if (global.___serializerTypes[type] === undefined) {
      logger.warn('Could not deserialize to type:', type, JSON.stringify(data, null, 2));
      return null;
    }
    return Object.assign(Object.create(global.___serializerTypes[type]), data);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function Serializable<T extends { new (...args: any[]): object }>(constructor: T): void {
  new Serializer().registerType(constructor);
}
