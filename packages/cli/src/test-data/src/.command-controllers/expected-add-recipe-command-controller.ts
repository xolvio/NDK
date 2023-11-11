import { Arg, Authorized, Ctx, Mutation, Resolver } from '@ddk/graphql';
import { Context } from '../deps/context';
import { AddRecipeCommand } from '../add-recipe-command';

@Resolver()
export class AddRecipeCommandController {
  @Authorized()
  @Mutation(() => Boolean)
  addRecipe(@Ctx() ctx: Context, @Arg('args') args: AddRecipeCommand): boolean {
    console.log(
      'messageBus.send',
      new AddRecipeCommand(args.aggregateId, args.title, args.description, ctx.user?.name || 'none'),
    );
    return true;
  }
}
