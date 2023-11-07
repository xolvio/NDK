Feature: Sell Item

  # Feature: SellItemBehaviour Handles the behaviour of selling an item 

  Rule: Item must exist in the inventory and have sufficient quantity 
    Example: Selling an item 
      Given an existing inventory item with sufficient quantity 
      When the SellItem command is executed with a quantity less than or equal to the item's quantity 
      Then the ItemSold event is triggered with the sold quantity