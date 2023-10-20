import { Command } from './Command';

describe('Command', () => {
  describe('constructor', () => {
    it('should set an aggregate id', () => {
      class MyCommand extends Command {
        constructor(aggregateId: string, public readonly foo: string) {
          super(aggregateId);
        }
      }

      const command = new MyCommand('123', 'foo');
      expect(command.aggregateId).toBe('123');
    });
  });
});
