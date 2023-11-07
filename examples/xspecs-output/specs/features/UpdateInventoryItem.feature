Feature: Update Inventory Item

  # Feature: UpdateInventoryItemBehaviour Handles the behaviour of updating an existing item in the inventory 

  Rule: Item must exist in the inventory 
    Example: Updating an existing item in the inventory 
      Given an existing inventory item 
      When the UpdateInventoryItem command is executed with updated item details 
      Then the InventoryItemUpdated event is triggered with the updated item details