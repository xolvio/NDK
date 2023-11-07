import { Authorized, Field, Float, Int, ObjectType, Query, Resolver } from '@ddk/graphql';

@ObjectType()
export class Recipe {
  @Field(() => String)
  title!: string;

  @Field(() => String, { nullable: true })
  description?: string;

  @Authorized() // Restrict access only for authenticated users
  @Field(() => [String])
  ingredients!: string[];

  @Authorized('ADMIN') // Restrict access only for 'ADMIN' users
  @Field(() => [Int])
  ratings!: number[];

  @Field(() => Float, { nullable: true })
  get averageRating(): number | null {
    if (!this.ratings.length) {
      return null;
    }
    return this.ratings.reduce((a, b) => a + b, 0) / this.ratings.length;
  }
}

function createRecipe(recipeData: Partial<Recipe>): Recipe {
  return Object.assign(new Recipe(), recipeData);
}

export const sampleRecipes = [
  createRecipe({
    title: 'Recipe 1',
    description: 'Desc 1',
    ingredients: ['one', 'two', 'three'],
    ratings: [3, 4, 5, 5, 5],
  }),
  createRecipe({
    title: 'Recipe 2',
    description: 'Desc 2',
    ingredients: ['four', 'five', 'six'],
    ratings: [3, 4, 5, 3, 2],
  }),
  createRecipe({
    title: 'Recipe 3',
    ingredients: ['seven', 'eight', 'nine'],
    ratings: [4, 4, 5, 5, 4],
  }),
];

@Resolver()
export class RecipeQueryResolver {
  private recipesData: Recipe[] = sampleRecipes.slice();

  @Query(() => [Recipe])
  async recipes(): Promise<Recipe[]> {
    return this.recipesData;
  }
}

export default RecipeQueryResolver;
