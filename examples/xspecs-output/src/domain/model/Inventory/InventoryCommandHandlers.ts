import { Handles, Repository } from '@ddk/core';
import { Inventory } from './Inventory';
import * as Commands from '../../Commands';

export class InventoryCommandHandlers {
  constructor(private readonly inventoryRepository: Repository<Inventory>) {}

  @Handles(Commands.AddInventoryItem)
  async addInventoryItem(c: Commands.AddInventoryItem): Promise<string | void> {
    const inventory = new Inventory(c.id ?? '1234');
    if (!inventory.addInventoryItem(c.itemName, c.itemDescription, c.itemPrice, c.itemQuantity))
      return inventory.getError();
    await this.inventoryRepository.save(inventory);
  }

  @Handles(Commands.UpdateInventoryItem)
  async updateInventoryItem(c: Commands.UpdateInventoryItem): Promise<string | void> {
    const inventory = await this.inventoryRepository.getById(c.itemId);
    if (!inventory) return 'Inventory not found';
    if (!inventory.updateInventoryItem(c.itemId, c.itemName, c.itemDescription, c.itemPrice, c.itemQuantity))
      return inventory.getError();
    await this.inventoryRepository.save(inventory);
  }

  @Handles(Commands.DeleteInventoryItem)
  async deleteInventoryItem(c: Commands.DeleteInventoryItem): Promise<string | void> {
    const inventory = await this.inventoryRepository.getById(c.itemId);
    if (!inventory) return 'Inventory not found';
    if (!inventory.deleteInventoryItem(c.itemId)) return inventory.getError();
    await this.inventoryRepository.save(inventory);
  }

  @Handles(Commands.SellItem)
  async sellItem(c: Commands.SellItem): Promise<string | void> {
    const inventory = await this.inventoryRepository.getById(c.itemId);
    if (!inventory) return 'Inventory not found';
    if (!inventory.sellItem(c.itemId, c.quantity)) return inventory.getError();
    await this.inventoryRepository.save(inventory);
  }

  @Handles(Commands.SendLowSellingItemNotification)
  async sendLowSellingItemNotification(c: Commands.SendLowSellingItemNotification): Promise<string | void> {
    const inventory = await this.inventoryRepository.getById(c.itemId);
    if (!inventory) return 'Inventory not found';
    if (!inventory.sendLowSellingItemNotification(c.itemId, c.unitsSold, c.period)) return inventory.getError();
    await this.inventoryRepository.save(inventory);
  }
}
