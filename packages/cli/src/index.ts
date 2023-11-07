#!/usr/bin/env ts-node
import { LocalGraphQLServer } from '@ddk/graphql';
import path from 'path';
import { Project, QuoteKind } from 'ts-morph';
import { rm } from 'fs/promises';
import { createCommandControllers } from './command-controller-builder';

export function loadProject(basePath = ''): Project {
  const project = new Project();
  project.manipulationSettings.set({
    quoteKind: QuoteKind.Single,
  });
  project.addSourceFilesAtPaths([path.join(basePath, '**/*.ts'), path.join(basePath, '!**/*.d.ts')]);
  return project;
}

function prepareProject(project: Project) {
  project.createDirectory('build/command-controllers');
}

async function deleteBuildDirectory() {
  await rm(path.join(process.cwd(), '.ddk', 'build'), { recursive: true, force: true });
}

async function build() {
  await deleteBuildDirectory();
  const project = loadProject();
  prepareProject(project);
  createCommandControllers(project);
}

async function serve() {
  // TODO improve this to search in a few different places for index.ts
  const modulePathArgIndex = process.argv.findIndex((arg) => arg === '--module-path') + 1;
  const modulePath =
    modulePathArgIndex > 0
      ? process.argv[modulePathArgIndex].replace('.', process.cwd())
      : path.join(path.join(process.cwd(), '.ddk', 'build', 'index.ts'));

  const { resolvers, context, authChecker } = await import(modulePath);

  await new LocalGraphQLServer().start({
    context,
    buildSchemaOptions: { resolvers, authChecker },
  });
}

(async () => {
  // stop server
  // loop to restart whenever files change
  await build();
  // start server
  if (Math.random() > 1) await serve();
})();
