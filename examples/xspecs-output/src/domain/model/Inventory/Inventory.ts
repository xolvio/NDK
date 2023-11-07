import { AggregateRoot } from '@ddk/core';
import * as Events from '../../Events';

type InventoryItem = {
  itemName: string;
  itemDescription: string;
  itemPrice: number;
  itemQuantity: number;
};

export class Inventory extends AggregateRoot {
  private inventoryItems: Record<string, InventoryItem> = {};

  addInventoryItem(itemName: string, itemDescription: string, itemPrice: number, itemQuantity: number): boolean {
    if (!itemName || !itemDescription || !itemPrice || !itemQuantity) {
      return this.applyError(Errors.MISSING_ITEM_DETAILS);
    }
    return this.applyChange(new Events.InventoryItemAdded('1234', itemName, itemDescription, itemPrice, itemQuantity));
  }

  applyInventoryItemAdded(event: Events.InventoryItemAdded): void {
    this.inventoryItems[event.aggregateId] = {
      itemName: event.itemName,
      itemDescription: event.itemDescription,
      itemPrice: event.itemPrice,
      itemQuantity: event.itemQuantity,
    };
  }

  updateInventoryItem(
    aggregateId: string,
    itemName: string,
    itemDescription: string,
    itemPrice: number,
    itemQuantity: number,
  ): boolean {
    const { applyChange, applyError, inventoryItems } = this;
    if (!inventoryItems[aggregateId]) {
      return applyError(Errors.ITEM_NOT_FOUND);
    }
    return applyChange(
      new Events.InventoryItemUpdated(aggregateId, itemName, itemDescription, itemPrice, itemQuantity),
    );
  }

  applyInventoryItemUpdated(event: Events.InventoryItemUpdated): void {
    this.inventoryItems[event.aggregateId] = {
      itemName: event.itemName,
      itemDescription: event.itemDescription,
      itemPrice: event.itemPrice,
      itemQuantity: event.itemQuantity,
    };
  }

  deleteInventoryItem(aggregateId: string): boolean {
    if (!this.inventoryItems[aggregateId]) {
      return this.applyError(Errors.ITEM_NOT_FOUND);
    }
    return this.applyChange(new Events.InventoryItemDeleted(aggregateId));
  }

  applyInventoryItemDeleted(event: Events.InventoryItemDeleted): void {
    delete this.inventoryItems[event.aggregateId];
  }

  sellItem(aggregateId: string, quantity: number): boolean {
    if (!this.inventoryItems[aggregateId] || this.inventoryItems[aggregateId].itemQuantity < quantity) {
      return this.applyError(Errors.INSUFFICIENT_QUANTITY);
    }
    return this.applyChange(new Events.ItemSold(aggregateId, quantity));
  }

  applyItemSold(event: Events.ItemSold): void {
    this.inventoryItems[event.aggregateId].itemQuantity -= event.quantity;
  }

  sendLowSellingItemNotification(aggregateId: string, unitsSold: number, period: string): boolean {
    if (!this.inventoryItems[aggregateId] || this.inventoryItems[aggregateId].itemQuantity > unitsSold) {
      return this.applyError(Errors.NOT_LOW_SELLING_ITEM);
    }
    return this.applyChange(new Events.LowSellingItemNotificationSent(aggregateId, unitsSold, period));
  }

  applyLowSellingItemNotificationSent(/*event: Events.LowSellingItemNotificationSent*/): void {
    // No state change required
  }
}

export const Errors = {
  MISSING_ITEM_DETAILS: 'Item details must be provided',
  ITEM_NOT_FOUND: 'Item not found',
  INSUFFICIENT_QUANTITY: 'Insufficient quantity',
  NOT_LOW_SELLING_ITEM: 'Item is not a low selling item',
};
