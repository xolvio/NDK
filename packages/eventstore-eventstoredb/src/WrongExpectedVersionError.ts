export class WrongExpectedVersionError extends Error {
  constructor() {
    super('Wrong expected version');
  }
}
