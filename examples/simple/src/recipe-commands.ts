import { AggregateRoot, Command, Handler, HandlerStrategy } from '@ddk/core';
import { Authorized, Ctx, Field, ID, InputType } from '@ddk/graphql';
import { Context } from './context';
import { Recipe } from './recipe';

@Authorized()
@InputType()
@Handler<AggregateRoot>(Recipe, { strategy: HandlerStrategy.CREATE })
export class AddRecipeCommand extends Command {
  @Field(() => ID)
  public readonly aggregateId: string;

  @Field(() => String)
  public readonly toot: string;

  @Field(() => String, { nullable: true })
  public readonly description?: string;

  @Ctx<Context>((ctx: Context) => ctx.user?.name || 'Dev')
  public readonly user: string;

  constructor(aggregateId: string, toot: string, description: string | undefined, user: string) {
    super();
    this.aggregateId = aggregateId;
    this.toot = toot;
    this.description = description;
    this.user = user;
  }
}

@Authorized(['ADMIN'])
@InputType()
@Handler<AggregateRoot>(Recipe, { strategy: HandlerStrategy.LOAD })
export class DeleteRecipeCommand extends Command {
  @Field(() => ID)
  public readonly aggregateId: string;

  @Field(() => String)
  public readonly toot: string;

  @Ctx<Context>((ctx: Context) => ctx.user?.name || 'Tom')
  public readonly userId: string;

  constructor(aggregateId: string, toot: string, userId: string) {
    super();
    this.aggregateId = aggregateId;
    this.toot = toot;
    this.userId = userId;
  }

  // handle overrides here?
}
