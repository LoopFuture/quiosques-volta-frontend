module.exports = {
  preset: 'jest-expo',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  watchman: false,
  collectCoverageFrom: [
    '<rootDir>/src/**/*.{ts,tsx}',
    '!<rootDir>/src/assets/**',
  ],
  coverageThreshold: {
    global: {
      branches: 89,
      functions: 89,
      lines: 89,
      statements: 89,
    },
  },
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  transformIgnorePatterns: [],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1',
    '\\.svg$': '<rootDir>/tests/support/svg-mock.tsx',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/support/jest.setup.ts'],
}
