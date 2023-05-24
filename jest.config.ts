import type {Config} from 'jest';
import {defaults} from 'jest-config';

const config: Config = {
  moduleFileExtensions: [...defaults.moduleFileExtensions, 'mts'],
  rootDir: '.',
  testEnvironment: 'node',
  testMatch: [`/**/*.specs.ts`],
  testPathIgnorePatterns: ['/dist/', '/node_modules/'],
  transform: {
    '^.+\\.ts?$': [
      'ts-jest',
      {
        isolatedModules: true,
        diagnostics: false,
        warnOnly: false,
      },
    ],
  }
};

export default config;
