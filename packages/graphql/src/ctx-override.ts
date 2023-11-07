/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types */

import { Ctx as TypeGraphQLCtx } from 'type-graphql';

// @ts-ignore
export function Ctx<T>(fn?: (ctx: T) => any) {
  return function (target: Object, propertyKey: string | symbol, parameterIndex?: number): void {
    // @ts-ignore
    TypeGraphQLCtx()(target, propertyKey, parameterIndex);
  };
}
