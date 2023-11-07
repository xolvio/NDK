import { Given, Then, When } from '@cucumber/cucumber';
import { World } from './hooks';
import { Inventory } from '../../src/domain/model';
import * as Events from '../../src/domain';
import expect from 'expect';

let inventory: Inventory;

Given('an existing inventory item with sufficient quantity', async function (this: World, dataTable) {
  const item = dataTable.hashes()[0];
  inventory = new Inventory('1234');
  inventory.addInventoryItem(item.name, item.description, item.price, item.quantity);
});

When(
  "the SellItem command is executed with a quantity less than or equal to the item's quantity",
  async function (this: World, dataTable) {
    const item = dataTable.hashes()[0];
    inventory.sellItem(item.id, item.quantity);
  },
);

Then('the ItemSold event is triggered with the sold quantity', async function (this: World, dataTable) {
  const item = dataTable.hashes()[0];
  const changes = inventory.getUncommittedChanges();
  expect(changes).toContainEqual(new Events.ItemSold(item.id, item.quantity));
});
