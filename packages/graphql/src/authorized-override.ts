import { Authorized as TypeGraphQLAuthorized } from 'type-graphql';
import { Decorator } from '@ddk/core';

type Role = string;
type AuthorizedArgs = Role | Role[];

// IF WE DON'T CARE WHEN GENERATING CODE ABOUT THE TYPE OF THE DECORATOR, WE CAN USE THIS
export function Authorized(): Decorator;
export function Authorized(role: Role): Decorator;
export function Authorized(roles: Role[]): Decorator;
export function Authorized(...args: AuthorizedArgs[]): Decorator {
  return TypeGraphQLAuthorized(...args) as Decorator;
}

// IF WE WANT TO DO SOMETHING DIFFERENT WITH CLASS DECORATORS, WE CAN USE THIS
// export function Authorized(): Decorator;
// export function Authorized(role: Role): Decorator;
// export function Authorized(roles: Role[]): Decorator;
// export function Authorized(...args: AuthorizedArgs[]): Decorator {
//   const roles: Role[] = Array.isArray(args[0]) ? args[0] : [args[0]];
//   return function (
//     // eslint-disable-next-line @typescript-eslint/ban-types
//     target: Object | Function,
//     propertyKey?: string | symbol,
//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     descriptor?: TypedPropertyDescriptor<any>,
//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   ): any {
//     if (descriptor) {
//       // ## METHOD DECORATOR
//       // eslint-disable-next-line @typescript-eslint/ban-types, @typescript-eslint/no-non-null-assertion
//       return TypeGraphQLAuthorized(...args)(target as Object, propertyKey!, descriptor);
//     } else if (propertyKey) {
//       // ## FIELD DECORATOR
//       // eslint-disable-next-line no-console
//       console.log(TypeGraphQLAuthorized(...args));
//       TypeGraphQLAuthorized(...roles)(target, propertyKey);
//     } else {
//       // ## CLASS DECORATOR
//       // eslint-disable-next-line @typescript-eslint/ban-types
//       return function (constructor: Function) {
//         // eslint-disable-next-line no-console
//         console.log('class', { constructor, roles });
//       };
//     }
//   } as Decorator;
// }
