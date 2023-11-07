import 'reflect-metadata';
import { ApolloServer, ApolloServerOptions, BaseContext } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { logger } from '../../logger-console/src/Logger';
import { BuildSchemaOptions, buildSchemaSync } from 'type-graphql';

class GraphQLServer<Context extends BaseContext> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static instance: GraphQLServer<any>;
  readonly #server: ApolloServer<Context>;

  private constructor(options: ApolloServerOptions<Context>) {
    this.#server = new ApolloServer<Context>(options);
  }

  public get server(): ApolloServer<Context> {
    return this.#server;
  }

  public static async getInstance<Context extends BaseContext>(
    options: ApolloServerOptions<Context>,
  ): Promise<GraphQLServer<Context>> {
    if (this.instance) {
      return this.instance;
    }
    this.instance = new GraphQLServer(options);
    return this.instance;
  }
}

export class LocalGraphQLServer<Context extends BaseContext> {
  async start({
    port,
    context,
    buildSchemaOptions,
    apolloOptions,
  }: {
    port?: number;
    context: () => Promise<Context>;
    buildSchemaOptions: BuildSchemaOptions;
    apolloOptions?: ApolloServerOptions<Context>;
  }): Promise<void> {
    const schema = buildSchemaSync(buildSchemaOptions);
    const options = apolloOptions ? { ...schema, ...apolloOptions } : { schema };
    const apollo = await GraphQLServer.getInstance<Context>(options);
    const { url } = await startStandaloneServer<Context>(apollo.server, {
      listen: { port: port ?? 4000 },
      context,
    });
    logger.log(`🚀 Server ready at: ${url}`);
  }
}
