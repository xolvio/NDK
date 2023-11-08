import { AggregateRoot, Command, Handler, HandlerStrategy } from '@ddk/core';
import { Authorized, Ctx, Field, InputType } from '@ddk/graphql';
import { Context } from './context';
import { Recipe } from './recipe';

@Authorized()
@InputType()
@Handler<AggregateRoot>(Recipe, { strategy: HandlerStrategy.CREATE })
export class AddRecipeCommand extends Command {
  @Field(() => String)
  public readonly title: string;

  @Field(() => String, { nullable: true })
  public readonly description?: string;

  @Ctx<Context>((ctx: Context) => ctx.user?.name || 'none')
  public readonly user: string;

  constructor(title: string, description: string | undefined, user: string) {
    super();
    this.title = title;
    this.description = description;
    this.user = user;
  }

  async handle(): Promise<boolean> {
    const data = structuredClone(this) as unknown as
      | Record<string, number | string>
      | string;
    const recipe = Object.assign(Object.create(Recipe), data);
    // await em.persist(recipe).flush();
    return recipe !== null;
  }
}

@Authorized(['ADMIN'])
@InputType()
@Handler<AggregateRoot>(Recipe, { strategy: HandlerStrategy.LOAD })
export class DeleteRecipeCommand extends Command {
  @Field(() => String)
  public readonly title: string;

  @Ctx<Context>((ctx: Context) => ctx.user?.name || 'none')
  public readonly userId: string;

  constructor(title: string, userId: string) {
    super();
    this.title = title;
    this.userId = userId;
  }
}
