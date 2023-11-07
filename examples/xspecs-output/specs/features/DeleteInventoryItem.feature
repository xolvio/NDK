Feature: Delete Inventory Item

  # Feature: DeleteInventoryItemBehaviour Handles the behaviour of deleting an item from the inventory 

  Rule: Item must exist in the inventory 
    Example: Deleting an item from the inventory 
      Given an existing inventory item 
      When the DeleteInventoryItem command is executed 
      Then the InventoryItemDeleted event is triggered