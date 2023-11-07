/* XSpecs Agent Notes:
This code creates step definitions for the given Gherkin feature. It uses the Inventory aggregate to perform actions and assert on the resulting events. The 'Given' step initializes a new Inventory instance. The 'When' step executes the 'addInventoryItem' method on the Inventory instance with the item details from the feature file. The 'Then' step asserts that the 'InventoryItemAdded' event is included in the uncommitted changes of the Inventory instance with the correct item details.
 */

import { Given, Then, When } from '@cucumber/cucumber';
import { World } from './hooks';
import { Inventory } from '../../src/domain/model';
import * as Events from '../../src/domain';
import expect from 'expect';

let inventory: Inventory;

Given('no prior inventory item', async function (this: World) {
  inventory = new Inventory('1234');
});

When('the AddInventoryItem command is executed with item details', async function (this: World, dataTable) {
  const itemDetails = dataTable.hashes()[0];
  inventory.addInventoryItem(
    itemDetails.itemName,
    itemDetails.itemDescription,
    itemDetails.itemPrice,
    itemDetails.itemQuantity,
  );
});

Then(
  'the InventoryItemAdded event is triggered with the provided item details',
  async function (this: World, dataTable) {
    const itemDetails = dataTable.hashes()[0];
    const events = inventory.getUncommittedChanges();
    expect(events).toContainEqual(
      new Events.InventoryItemAdded(
        '1234',
        itemDetails.itemName,
        itemDetails.itemDescription,
        itemDetails.itemPrice,
        itemDetails.itemQuantity,
      ),
    );
  },
);
