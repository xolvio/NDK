import { Arg, Authorized, Ctx, Mutation, Resolver } from '@ddk/graphql';
import { DeleteRecipeCommand } from '../commands';
import { Context } from '../context';

@Resolver()
export class DeleteRecipeCommandController {
  @Authorized()
  @Mutation(() => Boolean)
  deleteRecipe(
    @Ctx() ctx: Context,
    @Arg('args') args: DeleteRecipeCommand
  ): boolean {
    console.log(
      'messageBus.send',
      new DeleteRecipeCommand(args.title, ctx.user?.name || 'foo')
    );
    return true;
  }
}

//1