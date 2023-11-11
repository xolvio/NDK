import { Handles, Repository } from '@ddk/core';
import { AddRecipeCommand } from '../add-recipe-command';
import { Recipe } from '../deps/recipe';

export class AddRecipeCommandHandler {
  constructor(private readonly repository: Repository<Recipe>) {}

  @Handles(AddRecipeCommand)
  async addRecipe(command: AddRecipeCommand): Promise<string | void> {
    const recipe = new Recipe(command.aggregateId);
    if (!recipe.add()) return recipe.getError();
    await this.repository.save(recipe);
  }
}
