module.exports = {
  testEnvironment: 'node',
  coveragePathIgnorePatterns: ['/node_modules/'],
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  testTimeout: 10000,
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js']
};
