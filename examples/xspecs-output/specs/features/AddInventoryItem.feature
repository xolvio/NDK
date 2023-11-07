Feature: Add Inventory Item

  # Feature: AddInventoryItemBehaviour Handles the behaviour of adding a new item to the inventory 

  Rule: Item details must be provided 
    Example: Adding a new item to the inventory 
      Given no prior inventory item 
      When the AddInventoryItem command is executed with item details 
      Then the InventoryItemAdded event is triggered with the provided item details