export { context } from './context';
export { authChecker } from './auth-checker';

import { AddRecipeCommandController } from './.command-controllers/add-recipe-command-controller';
import { DeleteRecipeCommandController } from './.command-controllers/delete-recipe-command-controller';

import queries from './query-resolvers';

export const resolvers = [
  AddRecipeCommandController,
  DeleteRecipeCommandController,
  ...queries,
];
