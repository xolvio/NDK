import { Event, Serializable } from '@ddk/core';

@Serializable
export class InventoryItemAdded extends Event {
  constructor(
    public readonly aggregateId: string,
    public readonly itemName: string,
    public readonly itemDescription: string,
    public readonly itemPrice: number,
    public readonly itemQuantity: number,
  ) {
    super();
  }

  getType(): string {
    return 'InventoryItemAdded';
  }
}

@Serializable
export class InventoryItemUpdated extends Event {
  constructor(
    public readonly aggregateId: string,
    public readonly itemName: string,
    public readonly itemDescription: string,
    public readonly itemPrice: number,
    public readonly itemQuantity: number,
  ) {
    super();
  }

  getType(): string {
    return 'InventoryItemUpdated';
  }
}

@Serializable
export class InventoryItemDeleted extends Event {
  constructor(public readonly aggregateId: string) {
    super();
  }

  getType(): string {
    return 'InventoryItemDeleted';
  }
}

@Serializable
export class ItemSold extends Event {
  constructor(public readonly aggregateId: string, public readonly quantity: number) {
    super();
  }

  getType(): string {
    return 'ItemSold';
  }
}

@Serializable
export class LowSellingItemNotificationSent extends Event {
  constructor(public readonly aggregateId: string, public readonly unitsSold: number, public readonly period: string) {
    super();
  }

  getType(): string {
    return 'LowSellingItemNotificationSent';
  }
}
