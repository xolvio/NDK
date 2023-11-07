import {
  ClassDeclaration,
  ImportDeclaration,
  MethodDeclaration,
  Project,
  Scope,
  SourceFile,
  SyntaxKind,
} from 'ts-morph';
import { HandlerStrategy as HandlerStrategyOG } from '@ddk/core';

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

function isAuthorizedDecoratorPresent(classDeclaration: ClassDeclaration): boolean {
  return classDeclaration.getDecorators().some((decorator) => decorator.getName() === 'Authorized');
}

export function createCommandHandler(commandClass: ClassDeclaration, commandHandlerSourceFile: SourceFile): SourceFile {
  const commandClassName = commandClass.getNameOrThrow();
  const commandHandlerClassName = `${commandClassName}Handler`;
  const handlerMethodName = decapFirstLetter(removeStringFromText(commandClassName, 'Command'));

  commandHandlerSourceFile.addImportDeclaration({
    namedImports: [commandClassName],
    moduleSpecifier: commandHandlerSourceFile.getRelativePathAsModuleSpecifierTo(commandClass.getSourceFile()),
  });

  commandHandlerSourceFile.addImportDeclaration({
    namedImports: ['Handles', 'Repository'],
    moduleSpecifier: '@ddk/core',
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
    createOrLoad = `const ${aggregateName} = await this.repository.getById(command.aggregateId);`;
  handlerMethod.setBodyText(
    [
      createOrLoad,
      `if (!${aggregateName}.${aggregateMethod}()) return ${aggregateName}.getError();`,
      `await this.repository.save(${aggregateName});`,
    ].join('\n'),
  );

  return commandHandlerSourceFile;
}

export function createCommandController(
  commandClass: ClassDeclaration,
  commandControllerSourceFile: SourceFile,
): MethodDeclaration {
  const className = commandClass.getNameOrThrow();
  const commandProperties = commandClass.getProperties();
  const mutationName = decapFirstLetter(removeStringFromText(className, 'Command'));

  // FIXME how do we know if we need to import Arg, Authorized, Ctx, ID, Mutation, Resolver?
  commandControllerSourceFile.addImportDeclaration({
    namedImports: ['Arg', 'Authorized', 'Ctx', 'Mutation', 'Resolver'],
    moduleSpecifier: '@ddk/graphql',
  });

  commandControllerSourceFile.addImportDeclaration({
    namedImports: [className],
    moduleSpecifier: commandControllerSourceFile.getRelativePathAsModuleSpecifierTo(commandClass.getSourceFile()),
  });

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
    if (Object.keys(contextParamMethods).length > 0) {
      commandControllerSourceFile.addImportDeclaration({
        namedImports: ['Context'],
        moduleSpecifier: './context',
      });
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
  return resolverMethod;
}

export function createCommandControllers(project: Project): void {
  const commandClasses = findCommands(project);
  project.createDirectory('build/command-controllers');
  commandClasses.forEach((commandClass) => {
    const sourceFile = project.createSourceFile('build/command-controllers/resolver.ts', '', { overwrite: true });
    const c = createCommandController(commandClass, sourceFile);
    // eslint-disable-next-line no-console
    console.log(c.getSourceFile().getText());
  });
}
