import {
  Resolver,
  FieldResolver,
  Root,
  Arg,
  Ctx,
  Query,
  Authorized,
  Field,
  Float,
  Int,
  ObjectType,
} from '@ddk/graphql';
import { Context } from './context';
import { DataSource, RecipeModel } from './recipe-readmodel';

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

@Resolver()
export class RecipeResolver {
  constructor(private readonly recipeRepository: DataSource<RecipeModel>) {}

  @FieldResolver()
  async author(@Root() recipe: Recipe): Promise<string> {
    return recipe.title + '';
  }

  @Query(() => [Recipe]) // this can be inferred from the return type
  async recipes(@Arg('recipeId') recipeId: string, @Ctx() ctx: Context): Promise<[Recipe]> {
    this.recipeRepository.getById(recipeId + ctx);
    return [new Recipe()];
  }
}
