Feature: Send Low Selling Item Notification

  # Feature: SendLowSellingItemNotificationBehaviour Handles the behaviour of sending a notification for a low-selling item 

  Rule: Item must have sold less than a certain number of units in a specified period 
    Example: Sending a notification for a low-selling item 
      Given an item that has sold less than a certain number of units in a specified period 
      When the SendLowSellingItemNotification command is executed 
      Then the LowSellingItemNotificationSent event is triggered