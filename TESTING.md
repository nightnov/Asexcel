# Testing Guide for Asexcel

This document outlines the testing strategy and how to run tests for the Asexcel project.

## Overview

The test suite covers critical paths:
- **Utility functions** - Formula translation, validation, quota management
- **Components** - Chat messages, quota display
- **API routes** - File upload, authentication
- **Error handling** - Auth error messages, logging

## Installation

Tests use Jest and React Testing Library. Install dependencies:

```bash
npm install
```

## Running Tests

### All tests
```bash
npm test
```

### Watch mode (auto-rerun on changes)
```bash
npm run test:watch
```

### Coverage report
```bash
npm run test:coverage
```

## Test Structure

```
src/
├── lib/__tests__/
│   ├── excelFormulaTranslator.test.ts    # 13-language formula translation
│   ├── validation.test.ts                # File validation & sanitization
│   ├── quotaConfig.test.ts               # Quota constants
│   └── authError.test.ts                 # Error message handling
├── components/__tests__/
│   └── ChatMessage.test.tsx              # Chat message rendering
└── app/api/__tests__/
    └── upload.test.ts                    # File upload endpoint
```

## Test Coverage

### excelFormulaTranslator.test.ts (8 tests)
Tests the multi-language formula translator:
- ✅ FR→EN translation (RECHERCHEV → VLOOKUP)
- ✅ EN→FR translation (VLOOKUP → RECHERCHEV)
- ✅ Quoted text preservation during translation
- ✅ Multiple functions in one formula
- ✅ Language detection (FR, EN, ES, etc.)
- ✅ Separator swapping (`;` ↔ `,`)
- ✅ Case-insensitive matching
- ✅ 13-language support verification

### validation.test.ts (7 tests)
Tests file validation and filename sanitization:
- ✅ Accept XLSX, XLS, CSV files
- ✅ Reject non-Excel file types
- ✅ Enforce 10 MB file size limit
- ✅ Path traversal attack prevention
- ✅ Null byte removal
- ✅ Long filename handling

### quotaConfig.test.ts (6 tests)
Tests quota configuration:
- ✅ Member daily limit (default: 15)
- ✅ Guest daily limit (5)
- ✅ Guest < Member quota
- ✅ Environment variable override
- ✅ Default fallback values

### authError.test.ts (5 tests)
Tests authentication error messages:
- ✅ Common error messages (Email not confirmed, Invalid credentials)
- ✅ Unknown error fallback
- ✅ User-friendly French messages
- ✅ Error object handling
- ✅ Null/undefined safety

### ChatMessage.test.tsx (6 tests)
Tests chat message component:
- ✅ User message rendering
- ✅ Assistant message rendering
- ✅ Markdown content support
- ✅ Empty content handling
- ✅ Long content handling

### upload.test.ts (3 tests)
Tests file upload endpoint:
- ✅ Reject requests without file
- ✅ Reject invalid file types
- ✅ Turnstile token requirement

## Key Testing Patterns

### Unit Testing
```typescript
// Test a pure function
const result = translateFormula('=RECHERCHEV(...)', 'fr', 'en')
expect(result).toContain('VLOOKUP')
```

### Component Testing
```typescript
// Test a React component
render(<ChatMessage message={mockMessage} />)
expect(screen.getByText('message content')).toBeInTheDocument()
```

### API Testing
```typescript
// Test an API route
const response = await POST(mockRequest)
expect(response.status).toBe(200)
```

## Adding New Tests

1. Create a test file following the pattern:
   ```
   src/feature/__tests__/feature.test.ts
   ```

2. Import dependencies and mock external services:
   ```typescript
   import { functionToTest } from '@/feature'
   jest.mock('@/external-service', () => ({ ... }))
   ```

3. Write test cases:
   ```typescript
   describe('functionToTest', () => {
     it('should do something', () => {
       expect(result).toEqual(expected)
     })
   })
   ```

4. Run the test:
   ```bash
   npm test -- path/to/test.test.ts
   ```

## Coverage Goals

Current coverage areas:
- ✅ Utility functions: 80%+
- ✅ Component rendering: 60%+
- ✅ API endpoints: 50%+

Target coverage for production:
- Core utility functions: 90%+
- Critical components: 80%+
- API routes: 75%+

## Continuous Integration

Tests are configured to run automatically on:
- Pull requests (recommended)
- Before builds (via pre-commit hooks, if configured)

To enable GitHub Actions CI:
```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm test -- --coverage
```

## Troubleshooting

### Tests fail with "Cannot find module"
- Run `npm install` to ensure all dependencies are installed
- Check that path aliases in `jest.config.js` match `tsconfig.json`

### Tests timeout
- Increase Jest timeout: `jest.setTimeout(10000)`
- Check for missing mocks in `jest.setup.js`

### Type errors in tests
- Ensure `@types/jest` is installed
- Add type annotations: `const mockFn: jest.Mock = jest.fn()`

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Library Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

Last updated: 2026-08-16
