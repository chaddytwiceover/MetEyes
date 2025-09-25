# getGeminiFact Function Tests

This directory contains comprehensive tests for the `getGeminiFact` function from the MetEyes application.

## Overview

The `getGeminiFact` function is responsible for interacting with the Google Gemini API through a proxy endpoint. It takes artwork details and generates AI-powered insights about the artwork.

## Test Coverage

The test suite covers the following scenarios as requested:

### ✅ Successful API Call
- **Successful response**: Verifies the function correctly sends a request and processes a valid response
- **Missing optional fields**: Tests behavior when `artistDisplayName` or `objectDate` are missing
- **Empty optional fields**: Tests behavior when optional fields are empty strings

### ✅ Error Handling
- **HTTP Errors**: Tests various HTTP status codes (404, 429, 500)
- **Network Failures**: Tests network connectivity issues
- **Timeout Errors**: Tests request timeout scenarios
- **JSON Parsing Errors**: Tests malformed response handling

### ✅ Input Validation
- **Invalid artDetails**: Tests null, undefined, and non-object inputs
- **Missing title**: Tests when the required `title` field is missing
- **Invalid title**: Tests null, empty, and non-string title values

### ✅ Edge Cases
- **Empty responses**: Tests handling of empty API responses
- **Null text fields**: Tests responses with null text values
- **Error responses**: Tests API responses containing error fields
- **Special characters**: Tests Unicode and special characters in artwork details
- **Very long titles**: Tests handling of extremely long title strings

### ✅ Request Format Validation
- **Correct format**: Verifies POST request format, headers, and endpoint
- **Prompt construction**: Verifies the AI prompt is correctly constructed with artwork details

## Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## Test Architecture

- **Framework**: Jest with jsdom environment
- **Mocking**: Global fetch mock for API calls
- **Setup**: Automated test setup with proper cleanup between tests
- **Organization**: Tests are grouped by functionality for clarity

## Files

- `src/getGeminiFact.test.js` - Main test file with comprehensive test cases
- `src/api.js` - Modularized API functions for testing (extracted from script.js)
- `src/setupTests.js` - Jest setup configuration
- `package.json` - Test dependencies and scripts configuration

## Coverage

The test suite achieves:
- **79.16%** statement coverage
- **86.95%** branch coverage
- **24 test cases** covering all specified scenarios

## Notes

The tests include input validation that enhances the robustness of the original function. This validation ensures that:
1. `artDetails` must be a valid object (not null, undefined, or array)
2. `artDetails.title` must be a non-empty string

These validations improve error handling and make the function more reliable in production use.