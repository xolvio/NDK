import { AggregateRoot, Command, Handler, HandlerStrategy } from '@ddk/core';
import { ID, Authorized, Ctx, Field, InputType } from '@ddk/graphql';
import { Context } from './deps/context';
import { Recipe } from './deps/recipe';

@Authorized()
@InputType()
@Handler<AggregateRoot>(Recipe, { strategy: HandlerStrategy.CREATE })
export class AddRecipeCommand extends Command {
  @Field(() => ID)
  public readonly aggregateId: string;

  @Field(() => String)
  public readonly title: string;

  @Field(() => String, { nullable: true })
  public readonly description?: string;

  @Ctx<Context>((ctx: Context) => ctx.user?.name || 'none')
  public readonly user: string;

  constructor(aggregateId: string, title: string, description: string | undefined, user: string) {
    super(aggregateId);
    this.aggregateId = aggregateId;
    this.title = title;
    this.description = description;
    this.user = user;
  }
}
