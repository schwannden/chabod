# Test Documentation

This directory contains comprehensive testing for the Chabod application, organized into two main categories: RLS (Row Level Security) tests and UI component tests.

## Test Types Overview

### 🔒 RLS (Row Level Security) Tests

Located in [`tests/rls/`](./rls/)

RLS tests ensure that your Supabase database security policies work correctly by testing data access permissions for different user roles and scenarios. These tests verify that users can only access data they're authorized to see or modify.

**Key Features:**

- Tests all database operations (CRUD) with different user permissions
- Verifies tenant isolation and data security
- Tests business logic constraints and limits
- Automated test runner with Supabase CLI integration
- CI/CD optimized for GitHub Actions

**Quick Start:**

```bash
# Run all RLS tests
./tests/rls/run-rls-tests.sh

# Run with coverage
./tests/rls/run-rls-tests.sh --coverage
```

[**📖 Full RLS Testing Documentation →**](./rls/README.md)

---

### 🎨 UI Component Tests

Located in [`tests/ui/`](./ui/)

UI tests focus on component behavior, user interactions, and frontend functionality using Jest and React Testing Library. These tests ensure your React components work correctly and provide a good user experience.

**Key Features:**

- Component behavior and user interactions
- State management and side effects
- Integration with hooks and contexts
- Accessibility and user experience testing
- Error handling and edge cases

**Quick Start:**

```bash
# Run all UI tests
npm run test:ui

# Run in watch mode
npm run test:ui:watch
```

[**📖 Full UI Testing Documentation →**](./ui/README.md)

---

## Running All Tests

### Quick Commands

```bash
# Run both RLS and UI tests
npm test

# Run only RLS tests
./tests/rls/run-rls-tests.sh

# Run only UI tests
npm run test:ui

# Run with coverage (RLS)
./tests/rls/run-rls-tests.sh --coverage

# Run in watch mode (UI)
npm run test:ui:watch
```

### Test Structure

```
tests/
├── README.md                   # This overview document
├── ui/                         # UI component tests
│   ├── README.md              # UI testing documentation
│   ├── test-utils.tsx         # Shared UI testing utilities
│   ├── components/            # Component tests mirroring src/components/
│   ├── pages/                 # Page-level integration tests
│   ├── hooks/                 # Custom hook tests
│   ├── contexts/              # Context provider tests
│   └── lib/                   # Utility/service tests
├── rls/                       # RLS (Row Level Security) tests
│   ├── README.md              # RLS testing documentation
│   ├── setup.ts               # RLS test configuration
│   ├── run-rls-tests.sh       # Automated RLS test runner
│   ├── tenants.rls.test.ts    # Tenant security tests
│   ├── groups.rls.test.ts     # Group security tests
│   ├── events.rls.test.ts     # Event security tests
│   └── [...]                  # Other entity security tests
├── helpers/                   # Shared test helpers and utilities
├── __mocks__/                 # Jest mocks for external dependencies
└── ui-setup.ts               # UI test environment setup
```

## Testing Philosophy

### Comprehensive Coverage Strategy

**RLS Tests** ensure **data security** by verifying:

- ✅ Users can only access their tenant's data
- ✅ Proper permissions for different user roles
- ✅ Business logic constraints are enforced
- ✅ Cascading deletes work correctly

**UI Tests** ensure **user experience** by verifying:

- ✅ Components render correctly with different props
- ✅ User interactions work as expected
- ✅ Error states are handled gracefully
- ✅ Accessibility requirements are met

### Test Isolation

- **RLS tests** use real Supabase instances with test data isolation
- **UI tests** use mocked dependencies for fast, isolated execution
- Both test suites are independent and can run separately or together

### CI/CD Integration

Both test types run automatically in GitHub Actions:

- **UI tests** run first with mocked dependencies for speed
- **RLS tests** run with containerized Supabase services
- Tests run on pull requests and main branch pushes
- Coverage reporting available for both test types

## Environment Setup

### Prerequisites

**For RLS Tests:**

- Docker (for Supabase services)
- Supabase CLI
- Node.js environment

**For UI Tests:**

- Node.js environment
- No external dependencies (everything is mocked)

### Environment Variables

```bash
# Required for RLS tests
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# UI tests use mocked values automatically
```

## Best Practices

### When to Use Each Test Type

**Use RLS Tests when:**

- Testing database operations and permissions
- Verifying business logic constraints
- Testing tenant isolation
- Ensuring data security policies

**Use UI Tests when:**

- Testing component behavior and rendering
- Testing user interactions and form submissions
- Testing error handling and loading states
- Testing accessibility and keyboard navigation

### Writing Maintainable Tests

1. **Follow established patterns** documented in each test type's README
2. **Use shared utilities** to reduce duplication
3. **Write descriptive test names** that explain expected behavior
4. **Keep tests focused** on single responsibilities
5. **Clean up test data** properly to avoid interference

## Troubleshooting

### Common Issues

**RLS Tests:**

- Supabase not starting → Check Docker and port availability
- API key issues → Verify Supabase is fully started before key extraction
- Test timeouts → Check system resources and increase timeout values

**UI Tests:**

- Component not found → Check import paths and component exports
- Mock not working → Verify mock setup in test files or `__mocks__` directory
- Async operation issues → Use `waitFor` for async DOM updates

### Getting Help

- Check the specific README for each test type for detailed troubleshooting
- Review existing test files for patterns and examples
- Ensure all dependencies are properly installed and configured

## Contributing

When adding new features:

1. **Add RLS tests** for any new database tables or policies
2. **Add UI tests** for any new components or user-facing features
3. **Follow the established directory structure** mirroring `src/`
4. **Update documentation** when adding new testing patterns
5. **Ensure tests pass** in both local and CI environments

---

For detailed information about each test type, see their respective documentation:

- [**RLS Testing Guide**](./rls/README.md)
- [**UI Testing Guide**](./ui/README.md)
