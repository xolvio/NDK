import { logger } from './Logger';
import util from 'util';

describe('Logger', () => {
  describe('debug', () => {
    it('should debug when DEBUG env var is set', () => {
      jest.spyOn(console, 'debug').mockImplementation(() => {
      });
      process.env.DEBUG = 'true';
      logger.debug('test');
      // eslint-disable-next-line no-console
      expect(console.debug).toHaveBeenCalledWith('test');
    });
    it('should not debug when DEBUG env var is not set', () => {
      jest.spyOn(console, 'debug').mockImplementation(() => {
      });
      const debug = process.env.DEBUG;
      delete process.env.DEBUG;
      logger.debug('test');
      // eslint-disable-next-line no-console
      expect(console.debug).not.toHaveBeenCalledWith('test');
      process.env.DEBUG = debug;
    });
  });
  describe('log', () => {
    it('should debug', () => {
      jest.spyOn(console, 'log').mockImplementation(() => {
      });
      logger.log('test');
      // eslint-disable-next-line no-console
      expect(console.log).toHaveBeenCalledWith('test');
    });
  });
  describe('warn', () => {
    it('should debug', () => {
      jest.spyOn(console, 'warn').mockImplementation(() => {
      });
      logger.warn('test');
      // eslint-disable-next-line no-console
      expect(console.warn).toHaveBeenCalledWith('test');
    });
  });
  describe('error', () => {
    it('should debug', () => {
      jest.spyOn(console, 'error').mockImplementation(() => {
      });
      logger.error('test');
      // eslint-disable-next-line no-console
      expect(console.error).toHaveBeenCalledWith('test');
    });
  });
  describe('inspect', () => {
    it('should inspect', () => {
      const obj = {
        test: 'test',
        foo: { bar: 'baz' },
      };
      const expectedOutput = util.inspect(obj, false, null, true)


      jest.spyOn(console, 'error').mockImplementation(() => {
      });
      jest.spyOn(util, 'inspect');

      logger.inspect(obj);
      expect(util.inspect).toHaveBeenCalledWith(obj, false, null, true);
      expect(console.log).toHaveBeenCalledWith(expectedOutput);

    });
  });
});

afterEach(() => {
  jest.clearAllMocks();
});
