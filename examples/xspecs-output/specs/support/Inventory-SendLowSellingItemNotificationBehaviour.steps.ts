import { Given, Then, When } from '@cucumber/cucumber';
import { World } from './hooks';
import { Inventory } from '../../src/domain/model';
import * as Events from '../../src/domain';
import expect from 'expect';

let inventory: Inventory;

Given(
  'an item that has sold less than a certain number of units in a specified period',
  async function (
    this: World,
    itemName: string,
    itemDescription: string,
    itemPrice: number,
    itemQuantity: number,
    unitsSold: number,
  ) {
    inventory = new Inventory('1234');
    inventory.addInventoryItem(itemName, itemDescription, itemPrice, itemQuantity);
    inventory.sellItem(itemName, unitsSold);
  },
);

When(
  'the SendLowSellingItemNotification command is executed',
  async function (this: World, itemId: string, unitsSold: number, period: string) {
    inventory.sendLowSellingItemNotification(itemId, unitsSold, period);
  },
);

Then(
  'the LowSellingItemNotificationSent event is triggered',
  async function (this: World, itemId: string, unitsSold: number, period: string) {
    const changes = inventory.getUncommittedChanges();
    expect(changes).toContainEqual(new Events.LowSellingItemNotificationSent(itemId, unitsSold, period));
  },
);
