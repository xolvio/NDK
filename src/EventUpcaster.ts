import { Serializer } from './Serializer';
import { Event } from './Event';

const serializer = new Serializer();

type FromToValuePair = {
  from: string;
  to: string;
};

export interface IEventUpcaster {
  hasUpcaster(eventType: string): boolean;

  upcast(eventData: { [key: string]: object }, eventType: string): Event | undefined;

  registerDeprecatedEvent(deprecatedEventType: string, replacementEventType: string): IEventUpcaster;

  withReplacePropertiesUpcast(replacementProperties: FromToValuePair[]): IEventUpcaster;

  withClonePropertiesUpcast(cloneProperties: FromToValuePair[]): IEventUpcaster;

  withCopyPropertyValuesUpcast(copyPropertyValues: FromToValuePair[]): IEventUpcaster;
}

export class EventUpcaster implements IEventUpcaster {
  private readonly deprecatedEventToReplacementEventMap: { [key: string]: string } = {};
  private readonly replacementProperties: { [key: string]: FromToValuePair[] } = {};
  private readonly cloneProperties: { [key: string]: FromToValuePair[] } = {};
  private readonly copyPropertyValues: { [key: string]: FromToValuePair[] } = {};
  private currentDeprecatedEventType?: string;

  hasUpcaster(eventType: string): boolean {
    return !!this.deprecatedEventToReplacementEventMap[eventType];
  }

  upcast(eventData: { [key: string]: unknown }, eventType: string): Event | undefined {
    this.cloneProperties[eventType]?.forEach((item) => {
      if (eventData.hasOwnProperty(item.from)) {
        eventData[item.to] = eventData[item.from];
      }
    });
    if (this.deprecatedEventToReplacementEventMap[eventType]) {
      this.copyPropertyValues[eventType]?.forEach((item) => {
        if (eventData.hasOwnProperty(item.from)) {
          eventData[item.to] = eventData[item.from];
        }
      });
      this.replacementProperties[eventType]?.forEach((item) => {
        if (eventData.hasOwnProperty(item.from)) {
          eventData[item.to] = eventData[item.from];
          delete eventData[item.from];
        }
      });
      return serializer.deserialize(eventData, this.deprecatedEventToReplacementEventMap[eventType]);
    }
  }

  registerDeprecatedEvent(deprecatedEventType: string, replacementEventType: string) {
    this.deprecatedEventToReplacementEventMap[deprecatedEventType] = replacementEventType;
    this.currentDeprecatedEventType = deprecatedEventType;
    return this;
  }

  withReplacePropertiesUpcast(replacementProperties: FromToValuePair[]) {
    if (!this.currentDeprecatedEventType) {
      throw new Error('No deprecated event type registered');
    }
    this.replacementProperties[this.currentDeprecatedEventType] = replacementProperties;
    return this;
  }

  withClonePropertiesUpcast(cloneProperties: FromToValuePair[]) {
    if (!this.currentDeprecatedEventType) {
      throw new Error('No deprecated event type registered');
    }
    this.cloneProperties[this.currentDeprecatedEventType] = cloneProperties;
    return this;
  }

  withCopyPropertyValuesUpcast(copyPropertyValues: FromToValuePair[]) {
    if (!this.currentDeprecatedEventType) {
      throw new Error('No deprecated event type registered');
    }
    this.copyPropertyValues[this.currentDeprecatedEventType] = copyPropertyValues;
    return this;
  }
}
