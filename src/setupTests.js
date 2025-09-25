// Test setup file for Jest
// This file is run before all tests

// Mock fetch globally for tests
global.fetch = jest.fn();

// Mock console.error to avoid cluttering test output
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

// Clear all mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});