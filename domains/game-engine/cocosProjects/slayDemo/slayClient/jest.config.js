/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  moduleNameMapper: {
    '^cc$': '<rootDir>/test/__mocks__/cc.ts'
  },
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: {
        strict: false,
        esModuleInterop: true,
        experimentalDecorators: true
      }
    }]
  }
};
