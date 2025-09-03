module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: [
    '<rootDir>/tests/**/*.test.{js,ts,tsx}',
    '<rootDir>/src/**/__tests__/**/*.test.{js,ts,tsx}'
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@expo|expo|@react-native|@react-navigation|react-navigation|zustand|socket.io-client)/)'
  ],
  moduleNameMapping: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/android/',
    '/ios/',
    '/.expo/',
  ],
  testEnvironment: 'jsdom',
  verbose: true
};