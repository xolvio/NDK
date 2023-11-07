import { Given, Then, When } from '@cucumber/cucumber';
import { World } from './hooks';
import { Inventory } from '../../src/domain/model';
import * as Events from '../../src/domain';
import expect from 'expect';

let inventory: Inventory;

Given('an existing inventory item', async function (this: World) {
  inventory = new Inventory('item1');
  inventory.addInventoryItem('item1', 'description1', 10, 100);
  expect(inventory.getUncommittedChanges()).toContainEqual(
    new Events.InventoryItemAdded('item1', 'item1', 'description1', 10, 100),
  );
});

When('the DeleteInventoryItem command is executed', async function (this: World) {
  inventory.deleteInventoryItem('item1');
});

Then('the InventoryItemDeleted event is triggered', async function (this: World) {
  expect(inventory.getUncommittedChanges()).toContainEqual(new Events.InventoryItemDeleted('item1'));
});
