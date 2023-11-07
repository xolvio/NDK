/* eslint-disable no-console */
import { Arg, Authorized, Mutation, Resolver } from '@ddk/graphql';
import { DeleteRecipeCommand } from '../commands';

@Resolver()
export class DeleteRecipeCommandController {
  @Authorized(['ADMIN'])
  @Mutation(() => Boolean)
  deleteRecipe(@Arg('title', () => String) title: string): boolean {
    console.log('messageBus.send', new DeleteRecipeCommand(title));
    return true;
  }
}
