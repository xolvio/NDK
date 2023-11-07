/* eslint-disable no-console */
import { Arg, Authorized, Ctx, Mutation, Resolver } from '@ddk/graphql';
import { AddRecipeCommand } from '../commands';
import { Context } from '../context';

@Resolver()
export class AddRecipeCommandController {
  @Authorized()
  @Mutation(() => Boolean)
  addRecipe(
    @Ctx() ctx: Context,
    @Arg('title', () => String) title: string,
    @Arg('description', () => String, { nullable: true }) description?: string,
  ): boolean {
    console.log('messageBus.send', new AddRecipeCommand(title, description, ctx.user?.name || 'none'));
    return true;
  }
}
