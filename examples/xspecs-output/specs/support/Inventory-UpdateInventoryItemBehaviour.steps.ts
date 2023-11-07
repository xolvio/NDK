import { Given, Then, When } from '@cucumber/cucumber';
import { World } from './hooks';
import { Inventory } from '../../src/domain/model';
import * as Events from '../../src/domain';
import expect from 'expect';

let inventory: Inventory;
let itemId: string;

Given('an existing inventory item', async function (this: World) {
  inventory = new Inventory('1234');
  itemId = 'item1';
  inventory.addInventoryItem(itemId, 'Item 1', 10, 100);
  expect(inventory.getUncommittedChanges()).toContainEqual(
    new Events.InventoryItemAdded(itemId, 'Item 1', 'Description 1', 10, 100),
  );
});

When('the UpdateInventoryItem command is executed with updated item details', async function (this: World) {
  inventory.updateInventoryItem(itemId, 'Updated Item 1', 'Updated Description 1', 20, 200);
});

Then('the InventoryItemUpdated event is triggered with the updated item details', async function (this: World) {
  expect(inventory.getUncommittedChanges()).toContainEqual(
    new Events.InventoryItemUpdated(itemId, 'Updated Item 1', 'Updated Description 1', 20, 200),
  );
});
