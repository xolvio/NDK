import { createCommandController, createCommandHandler, findCommands } from './command-controller-builder';
import path from 'path';
import { Project } from 'ts-morph';
import prettier from 'prettier';

describe.only('Command Controller Builder', () => {
  describe('createCommandController', () => {
    it('should convert a commands', async () => {
      // GIVEN
      const project = new Project({ compilerOptions: { sourceRoot: path.join(__dirname, 'test-data', 'src') } });
      project.addSourceFileAtPath(path.join(__dirname, 'test-data', 'src', 'add-recipe-command.ts'));
      const classDeclaration = findCommands(project);
      // WHEN
      await createCommandController(project, classDeclaration[0], false);

      // THEN
      const sourceFileText = project
        .getSourceFileOrThrow(
          `${project.getCompilerOptions().sourceRoot}/.command-controllers/add-recipe-command-controller.ts`,
        )
        .getText();
      const sourceString = prettier.format(sourceFileText, { parser: 'typescript' });
      const targetFile = new Project().addSourceFileAtPath(
        path.join(__dirname, 'test-data', 'src', '.command-controllers', 'expected-add-recipe-command-controller.ts'),
      );
      const targetString = prettier.format(targetFile.getSourceFile().getText(), { parser: 'typescript' });
      expect(sourceString).toEqual(targetString);
    });
  });
  describe('createCommandHandler', () => {
    it('should convert a command', async () => {
      // GIVEN
      const project = new Project({ compilerOptions: { sourceRoot: path.join(__dirname, 'test-data', 'src') } });
      project.addSourceFileAtPath(path.join(__dirname, 'test-data', 'src', 'add-recipe-command.ts'));
      const classDeclaration = findCommands(project);

      // WHEN
      await createCommandHandler(project, classDeclaration[0], false);

      // THEN
      const sourceFileText = project
        .getSourceFileOrThrow(
          `${project.getCompilerOptions().sourceRoot}/.command-handlers/add-recipe-command-handler.ts`,
        )
        .getText();
      const sourceString = prettier.format(sourceFileText, { parser: 'typescript' });
      const targetFile = new Project().addSourceFileAtPath(
        path.join(__dirname, 'test-data', 'src', '.command-handlers', 'expected-add-recipe-command-handler.ts'),
      );
      const targetString = prettier.format(targetFile.getSourceFile().getText(), { parser: 'typescript' });
      expect(sourceString).toEqual(targetString);
    });
  });
});
