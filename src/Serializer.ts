import { logger } from './Logger';

declare let global: any;

export class Serializer {
  constructor() {
    if (global.___serializerTypes === undefined) global.___serializerTypes = {};
  }

  registerType(type: { new (...args: any[]): any }): void {
    global.___serializerTypes[type.name] = type.prototype;
  }

  serialize(obj: object): Record<string, number | string> | string {
    return structuredClone(obj) as Record<string, number | string> | string;
  }

  deserialize(data: object, type: string): any {
    if (global.___serializerTypes[type] === undefined) {
      logger.warn('Could not deserialize to type:', type, JSON.stringify(data, null, 2));
      return null;
    }
    return Object.assign(Object.create(global.___serializerTypes[type]), data);
  }
}

export function Serializable<T extends { new (...args: any[]): {} }>(constructor: T) {
  new Serializer().registerType(constructor);
}
