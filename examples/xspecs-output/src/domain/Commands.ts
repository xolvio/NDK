import { Command } from '@ddk/core';
import { Field, InputType } from 'type-graphql';

@InputType()
export class AddInventoryItem extends Command {
  @Field()
  public readonly id: string;
  @Field()
  public readonly itemName: string;
  @Field()
  public readonly itemDescription: string;
  @Field()
  public readonly itemPrice: number;
  @Field()
  public readonly itemQuantity: number;

  constructor(id: string, itemName: string, itemDescription: string, itemPrice: number, itemQuantity: number) {
    super();
    this.id = id;
    this.itemQuantity = itemQuantity;
    this.itemPrice = itemPrice;
    this.itemDescription = itemDescription;
    this.itemName = itemName;
  }
}

// @Authroized([roles], { policy }) // ddk decorator
// @InputType('AddProjectArgs') // typegraphql decorator
// @Handler(AggregateRoot({ root: FooBar, strategy: CREATE })) // ddk decorator
// export class AddProjectCommand extends Command {
//   @Field()
//   @MaxLength(50)
//   public readonly workspaceId: string;
//   @Field()
//   public readonly projectId: string;
//   @Context('user.token')
//   public readonly projectName: string;
//
//   constructor(workspaceId: string, projectId: string, projectName: string) {
//     super(workspaceId);
//     this.projectName = projectName;
//     this.projectId = projectId;
//     this.workspaceId = workspaceId;
//   }
// }

export class UpdateInventoryItem extends Command {
  constructor(
    public readonly itemId: string,
    public readonly itemName: string,
    public readonly itemDescription: string,
    public readonly itemPrice: number,
    public readonly itemQuantity: number,
  ) {
    super();
  }
}

export class DeleteInventoryItem extends Command {
  constructor(public readonly itemId: string) {
    super();
  }
}

export class SellItem extends Command {
  constructor(public readonly itemId: string, public readonly quantity: number) {
    super();
  }
}

export class SendLowSellingItemNotification extends Command {
  constructor(public readonly itemId: string, public readonly unitsSold: number, public readonly period: string) {
    super();
  }
}
