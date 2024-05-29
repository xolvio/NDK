import { LocalGraphQLServer } from '@ddk/graphql';
import path from 'path';
import process from 'process';

// @ts-ignore
let server: LocalGraphQLServer;

export async function serve(): Promise<void> {
  // TODO improve this to search in a few different places for index.ts
  const modulePathArgIndex = process.argv.findIndex((arg) => arg === '--module-path') + 1;
  const modulePath =
    modulePathArgIndex > 0
      ? process.argv[modulePathArgIndex].replace('.', process.cwd())
      : path.join(path.join(process.cwd(), 'src', 'index.ts'));

  const { resolvers, context, authChecker } = await import(modulePath);
  server = new LocalGraphQLServer();
  await server.start({
    context,
    buildSchemaOptions: { resolvers, authChecker },
  });
}

(async () => {
  await serve();
})();
