import { ClassDeclaration, ImportDeclaration, Project, QuoteKind, Scope, SourceFile, SyntaxKind } from 'ts-morph';
import { HandlerStrategy as HandlerStrategyOG } from '@ddk/core';
// import { rm } from 'fs/promises';
import path from 'path';
import prettier from 'prettier';

export function findCommands(project: Project): ClassDeclaration[] {
  return project
    .getSourceFiles()
    .map((sourceFile) => sourceFile.getClasses().filter((c) => c.getBaseClass()?.getName() === 'Command'))
    .flat();
}

function decapFirstLetter(text: string) {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

function removeStringFromText(text: string, str: string): string {
  return text.replace(str, '');
}

function camelToKebabCase(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

function isAuthorizedDecoratorPresent(classDeclaration: ClassDeclaration): boolean {
  return classDeclaration.getDecorators().some((decorator) => decorator.getName() === 'Authorized');
}

function handleImports(commandClass: ClassDeclaration, commandControllerSourceFile: SourceFile, className: string) {
  commandControllerSourceFile.addImportDeclaration({
    namedImports: ['Arg', 'Authorized', 'Ctx', 'Mutation', 'Resolver'],
    moduleSpecifier: '@ddk/graphql',
  });
  commandClass
    .getSourceFile()
    .getImportDeclarations()
    .forEach((importDeclaration) => {
      const importDeclarationModuleSpecifierValue = importDeclaration.getModuleSpecifierValue();

      // ignore imports of @ddk/core and @ddk/graphql since the command controller will import its own deps from here
      if (['@ddk/core', '@ddk/graphql'].indexOf(importDeclarationModuleSpecifierValue) !== -1) return;

      // ignore imports of classes that extend AggregateRoot
      if (
        importDeclaration
          .getModuleSpecifierSourceFileOrThrow()
          .getClasses()
          .find((c) => c.getExtends()?.getText() === 'AggregateRoot')
      )
        return;

      const path =
        importDeclarationModuleSpecifierValue.charAt(0) === '@'
          ? importDeclaration.getModuleSpecifierValue()
          : commandControllerSourceFile.getRelativePathAsModuleSpecifierTo(
              importDeclaration.getModuleSpecifierSourceFileOrThrow().getFilePath(),
            );

      // Check for default import
      const defaultImport = importDeclaration.getDefaultImport();
      if (defaultImport) {
        commandControllerSourceFile.addImportDeclaration({
          moduleSpecifier: path,
          defaultImport: defaultImport.getText(),
        });
      }

      // Check for named imports
      const namedImports = importDeclaration.getNamedImports().map((ni) => ni.getName());
      if (namedImports.length > 0) {
        commandControllerSourceFile.addImportDeclaration({
          moduleSpecifier: path,
          namedImports,
        });
      }
    });

  commandControllerSourceFile.addImportDeclaration({
    namedImports: [className],
    moduleSpecifier: commandControllerSourceFile.getRelativePathAsModuleSpecifierTo(commandClass.getSourceFile()),
  });
}

export async function createCommandHandler(
  project: Project,
  commandClass: ClassDeclaration,
  save = true,
): Promise<void> {
  const commandClassName = commandClass.getNameOrThrow();
  const commandHandlerClassName = `${commandClassName}Handler`;
  const handlerMethodName = decapFirstLetter(removeStringFromText(commandClassName, 'Command'));

  const sourceRoot = project.getCompilerOptions().sourceRoot;
  const commandHandlerSourceFile = project.createSourceFile(
    `${sourceRoot}/.command-handlers/${camelToKebabCase(commandClass.getNameOrThrow())}-handler.ts`,
    '',
    {
      overwrite: true,
    },
  );

  commandHandlerSourceFile.addImportDeclaration({
    namedImports: ['Handles', 'Repository'],
    moduleSpecifier: '@ddk/core',
  });

  commandHandlerSourceFile.addImportDeclaration({
    namedImports: [commandClassName],
    moduleSpecifier: commandHandlerSourceFile.getRelativePathAsModuleSpecifierTo(commandClass.getSourceFile()),
  });

  // find the @Handler decorator
  const handlerDecorator = commandClass.getDecorators().find((d) => d.getName() === 'Handler');
  if (!handlerDecorator) throw new Error('handlerDecorator not found');
  const callExpression = handlerDecorator.getCallExpressionOrThrow();

  // import the target construct
  const targetConstructClassName = callExpression.getArguments()[0].getText(); // Class name
  const commandImportDeclarations = commandClass.getSourceFile().getImportDeclarations();

  const constructImport = commandImportDeclarations.find(
    (importDeclaration: ImportDeclaration) => importDeclaration.getText().indexOf(targetConstructClassName) !== -1,
  );
  if (!constructImport) throw new Error('constructImport not found');
  const constructSourceFile = constructImport.getModuleSpecifierSourceFileOrThrow();

  commandHandlerSourceFile.addImportDeclaration({
    namedImports: [targetConstructClassName],
    moduleSpecifier: commandHandlerSourceFile.getRelativePathAsModuleSpecifierTo(constructSourceFile),
  });

  const commandHandlerClass = commandHandlerSourceFile.addClass({
    name: `${commandHandlerClassName}`,
    isExported: true,
  });
  commandHandlerClass.addConstructor({
    parameters: [
      {
        name: 'repository',
        scope: Scope.Private,
        isReadonly: true,
        type: `Repository<${targetConstructClassName}>`,
      },
    ],
  });

  const handlerMethodDecorators = [{ name: 'Handles', arguments: [commandClassName] }];
  const handlerMethod = commandHandlerClass.addMethod({
    name: handlerMethodName,
    isAsync: true,
    returnType: 'Promise<string | void>',
    decorators: handlerMethodDecorators,
  });

  handlerMethod.addParameter({
    name: 'command',
    type: commandClassName,
  });

  const HandlerStrategy = HandlerStrategyOG;
  const object = eval('(' + callExpression.getArguments()[1].getText() + ')');

  const aggregateName = decapFirstLetter(targetConstructClassName);
  const aggregateMethod = removeStringFromText(handlerMethodName, targetConstructClassName);
  let createOrLoad = '';
  if (object.strategy === HandlerStrategy.CREATE)
    createOrLoad = `const ${aggregateName} = new ${targetConstructClassName}(command.aggregateId);`;
  if (object.strategy === HandlerStrategy.LOAD)
    createOrLoad = [
      `const ${aggregateName} = await this.repository.getById(command.aggregateId);`,
      `if (!${aggregateName}) return '${aggregateName} not found';`,
    ].join('\n');
  handlerMethod.setBodyText(
    [
      createOrLoad,
      `if (!${aggregateName}.${aggregateMethod}()) return ${aggregateName}.getError();`,
      `await this.repository.save(${aggregateName});`,
    ].join('\n'),
  );

  if (save) await saveFile(commandHandlerSourceFile);
}

export async function createCommandController(
  project: Project,
  commandClass: ClassDeclaration,
  save = true,
): Promise<void> {
  const className = commandClass.getNameOrThrow();
  const commandProperties = commandClass.getProperties();
  const mutationName = decapFirstLetter(removeStringFromText(className, 'Command'));

  const sourceRoot = project.getCompilerOptions().sourceRoot;
  const commandControllerSourceFile = project.createSourceFile(
    `${sourceRoot}/.command-controllers/${camelToKebabCase(commandClass.getNameOrThrow())}-controller.ts`,
    '',
    {
      overwrite: true,
    },
  );

  handleImports(commandClass, commandControllerSourceFile, className);

  const resolverClass = commandControllerSourceFile.addClass({
    name: `${className}Controller`,
    isExported: true,
    decorators: [{ name: 'Resolver', arguments: [] }],
  });

  const resolverMethodDecorators = [{ name: 'Mutation', arguments: ['() => Boolean'] }];
  if (isAuthorizedDecoratorPresent(commandClass)) {
    resolverMethodDecorators.unshift({ name: 'Authorized', arguments: [] });
  }

  const resolverMethod = resolverClass.addMethod({
    name: mutationName,
    returnType: 'boolean',
    decorators: resolverMethodDecorators,
  });

  resolverMethod.addParameter({
    name: 'ctx',
    type: 'Context',
    decorators: [{ name: 'Ctx', arguments: [] }],
  });

  function extractFunctionBody(arrowFunctionText: string): string {
    const match = arrowFunctionText.match(/\(?[^)]*\)?\s*=>\s*({?)([^}]*)}?/);
    return match ? match[2].trim() : '';
  }

  const contextParamMethods: { [key: string]: string } = {};
  commandProperties.forEach((prop) => {
    const propName = prop.getName();
    const ctxDecorator = prop.getDecorators().find((d) => d.getName() === 'Ctx');
    if (ctxDecorator) {
      const ctxDecorator = prop.getDecorators().find((d) => d.getName() === 'Ctx');
      const ctxDecoratorArgs = ctxDecorator?.getArguments();
      if (ctxDecoratorArgs && ctxDecoratorArgs.length > 0) {
        const arrowFunction = ctxDecoratorArgs[0];
        if (arrowFunction && arrowFunction.getKind() === SyntaxKind.ArrowFunction) {
          const arrowFunctionText = arrowFunction.getFullText();
          contextParamMethods[propName] = extractFunctionBody(arrowFunctionText);
        }
      }
    }
  });

  resolverMethod.addParameter({
    name: 'args',
    type: className,
    decorators: [
      {
        name: 'Arg',
        arguments: ['"args"'],
      },
    ],
  });

  const commandArgs = commandProperties
    .map((prop) => {
      const propName = prop.getName();
      if (Object.prototype.hasOwnProperty.call(contextParamMethods, propName)) {
        return `(${contextParamMethods[propName]})`;
      }
      return `args.${propName}`;
    })
    .join(', ');

  resolverMethod.setBodyText(`console.log('messageBus.send', new ${className}(${commandArgs}));\nreturn true;`);
  if (save) await saveFile(commandControllerSourceFile);
}

export async function createCommandControllersAndHandlers(project: Project): Promise<void> {
  const commandClasses = findCommands(project);
  for (const commandClass of commandClasses) {
    await createCommandHandler(project, commandClass);
    await createCommandController(project, commandClass);
  }
}

export function loadProject(project: Project, basePath = ''): Project {
  project.addSourceFilesAtPaths([path.join(basePath, '**/*.ts'), path.join(basePath, '!**/*.d.ts')]);
  return project;
}

export function reloadProjectFiles(project: Project, changedFilePaths: string[]): Project {
  changedFilePaths.forEach((filePath) => {
    const sourceFile = project.getSourceFile(filePath);
    if (sourceFile) project.removeSourceFile(sourceFile);
    project.addSourceFileAtPath(filePath);
  });
  return project;
}

function prepareProject(project: Project) {
  project.createDirectory('src/.command-controllers');
}

// async function deleteBuildDirectory() {
//   await rm(path.join(process.cwd(), 'src/.command-controllers'), { recursive: true, force: true });
// }

async function saveFile(file: SourceFile): Promise<void> {
  const formattedCode = prettier.format(file.getFullText(), {
    parser: 'typescript',
    singleQuote: true,
  });
  file.replaceWithText(formattedCode);
  await file.save();
}

export class Builder {
  project: Project;

  constructor(sourceDir = 'src') {
    this.project = new Project({ compilerOptions: { sourceRoot: path.join(process.cwd(), sourceDir) } });
    this.project.manipulationSettings.set({
      quoteKind: QuoteKind.Single,
    });
    loadProject(this.project);
  }

  async build(changedPaths: string[]): Promise<boolean> {
    try {
      // await deleteBuildDirectory();
      reloadProjectFiles(this.project, changedPaths);
      prepareProject(this.project);
      await createCommandControllersAndHandlers(this.project);
      return true;
    } catch (e) {
      const error = e as unknown as Error;
      if (error.message.indexOf('File not found') !== -1) return true;
      // eslint-disable-next-line no-console
      console.error(error);
      return false;
    }
  }
}
