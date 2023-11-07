import { createCommandController, createCommandHandler, findCommands } from './command-controller-builder';
import path from 'path';
import { Project } from 'ts-morph';
import prettier from 'prettier';

describe.only('Command Controller Builder', () => {
  describe('createCommandController', () => {
    it('should convert a command', async () => {
      // GIVEN
      const project = new Project();
      project.addSourceFileAtPath(path.join(__dirname, 'test-data', 'add-recipe-command.ts'));
      const classDeclaration = findCommands(project);
      const commandControllerSourceFile = project.createSourceFile(
        path.join(__dirname, 'test-data', 'add-recipe-command-controller.ts'),
      );
      // WHEN
      const commandController = createCommandController(classDeclaration[0], commandControllerSourceFile);
      // THEN
      const sourceString = prettier.format(commandController.getSourceFile().getText(), { parser: 'typescript' });
      const targetFile = new Project().addSourceFileAtPath(
        path.join(__dirname, 'test-data', 'expected-add-recipe-command-controller.ts'),
      );
      const targetString = prettier.format(targetFile.getSourceFile().getText(), { parser: 'typescript' });
      expect(sourceString).toEqual(targetString);
    });
  });
  describe('createCommandHandler', () => {
    it('should convert a command', async () => {
      // GIVEN
      const project = new Project();
      project.addSourceFileAtPath(path.join(__dirname, 'test-data', 'add-recipe-command.ts'));
      const classDeclaration = findCommands(project);
      const commandHandlerSourceFile = project.createSourceFile(
        path.join(__dirname, 'test-data', 'add-recipe-command-handler.ts'),
      );
      // WHEN
      const commandHandler = createCommandHandler(classDeclaration[0], commandHandlerSourceFile);
      // THEN
      const sourceString = prettier.format(commandHandler.getText(), { parser: 'typescript' });
      const targetFile = new Project().addSourceFileAtPath(
        path.join(__dirname, 'test-data', 'expected-add-recipe-command-handler.ts'),
      );
      const targetString = prettier.format(targetFile.getSourceFile().getText(), { parser: 'typescript' });
      expect(sourceString).toEqual(targetString);
    });
  });
});
