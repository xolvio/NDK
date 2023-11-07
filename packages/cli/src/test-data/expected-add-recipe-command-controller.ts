import { Arg, Authorized, Ctx, Mutation, Resolver } from '@ddk/graphql';
import { AddRecipeCommand } from './add-recipe-command';
import { Context } from './context';

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
