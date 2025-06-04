# Test Documentation

This document outlines the testing policies, standards, and patterns for the Chabod application.

## Test Policy

### Testing Philosophy

- **Comprehensive Coverage**: All RLS (Row Level Security) policies must be tested
- **Consistent Patterns**: Use standardized test structures to reduce duplication
- **Maintainable Code**: Write tests that are easy to understand and modify
- **Isolated Tests**: Each test should be independent and not rely on other tests

### Test Requirements

1. **All database operations** must have corresponding RLS tests
2. **Business logic** should be tested with custom test cases
3. **Error handling** must be tested for both success and failure scenarios
4. **Performance constraints** (like tenant limits) must be verified

## CI/CD Integration

The project includes automated testing in GitHub Actions that runs RLS tests using Supabase in a containerized environment.

### GitHub Actions Workflow

The CI workflow (`.github/workflows/ci.yml`) includes two jobs:

1. **Build Job**: Runs linting and builds the project across Node.js 20.x and 22.x
2. **Test Job**: Runs RLS tests with Supabase services

### How CI Tests Work

The test job performs these steps:

1. **Environment Setup**: Installs Node.js dependencies and Supabase CLI
2. **Docker Verification**: Ensures Docker is available for Supabase services
3. **Environment Configuration**: Creates `.env.test` with placeholder values
4. **Supabase Startup**: Starts all Supabase services (PostgreSQL, Auth, Storage, etc.)
5. **Key Extraction**: Extracts real API keys from running Supabase instance
6. **Environment Update**: Updates `.env.test` with actual API keys
7. **Test Execution**: Runs RLS tests using the CI-optimized script
8. **Cleanup**: Stops Supabase services

### CI Test Script

The project includes a unified test runner script that automatically adapts to different environments:

- `tests/run-rls-tests.sh` - Works in both local development and CI environments

The script automatically detects whether it's running in a CI environment (GitHub Actions) or locally and adapts its behavior:

**Local Development Features:**

- Creates `.env.test` from example if missing
- Starts Supabase automatically if not running
- Shows full Supabase status
- Extracts and updates API keys in `.env.test`
- Supports interactive features like watch mode

**CI Environment Features:**

- Verifies environment variables are properly set
- Expects Supabase to already be running
- Shows abbreviated status for cleaner CI logs
- Uses `--maxWorkers=1` for stability
- Skips interactive features
- Provides streamlined error messages

### Supabase CLI Compatibility

The script automatically detects and works with various Supabase CLI installation methods:

- **Global Installation**: `supabase` command directly
- **npm/yarn Installation**: `npx supabase` or `yarn supabase`
- **Local Development**: Uses whatever method is available

This follows the [official Supabase CLI installation guide](https://supabase.com/docs/guides/local-development/cli/getting-started) and supports all recommended installation methods.

### Docker in GitHub Actions

- GitHub Actions runners come with Docker pre-installed
- Supabase CLI uses Docker containers for its services
- The workflow includes Docker verification and privileged mode for container management
- Services are automatically cleaned up after test completion

### Performance Optimizations for CI

- **Single Worker**: Tests run with `--maxWorkers=1` to prevent resource conflicts
- **Timeout Protection**: Supabase startup has a 5-minute timeout
- **Efficient Cleanup**: Uses `|| true` for cleanup commands to prevent CI failures
- **Environment Caching**: Node.js dependencies are cached between runs

### Running Tests in CI

Tests automatically run on:

- Pull requests (opened, synchronized, reopened)
- Pushes to the main branch

You can also trigger tests manually through the GitHub Actions interface.

## Test Structure

### Directory Organization

```
tests/
├── setup.ts                    # Global test configuration and utilities
├── helpers/
│   ├── rls-test-base.ts        # Base class for RLS testing
│   └── test-data-factory.ts    # Data creation utilities
└── rls/
    ├── tenants.rls.test.ts     # Tenant RLS policies
    ├── groups.rls.test.ts      # Group RLS policies
    ├── resources.rls.test.ts   # Resource RLS policies
    ├── events.rls.test.ts      # Event RLS policies
    └── tenant-members.rls.test.ts # Tenant member RLS policies
```

### File Naming Conventions

- Test files: `{entity}.rls.test.ts` for RLS tests
- Helper files: `{purpose}-{type}.ts` (e.g., `test-data-factory.ts`)
- Use kebab-case for file names
- Use descriptive names that indicate the test scope

## RLS Testing Standards

### Base Class Usage

All RLS tests should use the `RLSTestBase` class for consistent patterns:

```typescript
import { createRLSTest } from "../helpers/rls-test-base";
import { createTestGroup } from "../helpers/test-data-factory";

const rlsTest = createRLSTest();

// Generate standard CRUD tests automatically
rlsTest.createStandardRLSTestSuite({
  entityName: "Group",
  tableName: "groups",
  createEntityFn: createTestGroup,
  additionalEntityData: {
    description: "Test group for RLS testing",
  },
});
```

### Standard Test Coverage

Every entity must test these RLS patterns:

#### Creation Policies

- ✅ Owners can create entities
- ✅ Members cannot create entities (unless specified)
- ✅ Outsiders cannot create entities
- ✅ Anonymous users cannot create entities

#### Update Policies

- ✅ Owners can update entities
- ✅ Members cannot update entities (unless specified)
- ✅ Outsiders cannot update entities

#### Delete Policies

- ✅ Owners can delete entities
- ✅ Members cannot delete entities (unless specified)
- ✅ Outsiders cannot delete entities

#### Select Policies

- ✅ Tenant members can view entities in their tenant
- ✅ Outsiders cannot view private entities

### Custom Business Logic Tests

For entity-specific rules, write custom tests:

```typescript
describe("Groups RLS Policies - Custom Tests", () => {
  it("should enforce tenant group limit", async () => {
    await rlsTest.setupTestContext();
    try {
      const { owner, tenant } = rlsTest.getContext();
      // ... custom test logic
    } finally {
      await rlsTest.cleanupTestContext();
    }
  });
});
```

### Test Context Management

Always use the standardized context management:

```typescript
// Setup test context (creates owner, member, outsider, tenant)
await rlsTest.setupTestContext();

try {
  const { owner, member, outsider, tenant } = rlsTest.getContext();
  // ... test logic
} finally {
  // Always cleanup in finally block
  await rlsTest.cleanupTestContext();
}
```

## Test Style Guidelines

### Test Descriptions

- Use descriptive test names that explain the expected behavior
- Follow the pattern: "should [action] [expected result] [conditions]"
- Examples:
  - ✅ `"should allow tenant owners to create groups"`
  - ✅ `"should prevent members from deleting resources"`
  - ❌ `"test group creation"` (too vague)

### Test Organization

```typescript
describe("Entity RLS Policies", () => {
  describe("Entity Creation Policy", () => {
    it("should allow authorized users to create entities", () => {});
    it("should prevent unauthorized users from creating entities", () => {});
  });

  describe("Entity Update Policy", () => {
    // Update tests
  });

  describe("Entity Delete Policy", () => {
    // Delete tests
  });
});

describe("Entity RLS Policies - Custom Tests", () => {
  // Business logic specific tests
});
```

### Assertion Patterns

```typescript
// Standard success assertions
expect(error).toBeNull();
expect(data).toBeDefined();
expect(data.name).toBe("Expected Name");

// Standard failure assertions
expect(error).toBeDefined();
expect(data).toBeNull();
expect(error?.message).toContain("new row violates row-level security policy");

// For update/delete operations that should fail
expect(data).toEqual([]); // No rows affected

// For "not found" scenarios
expect(error?.code).toBe("PGRST116");
expect(data).toBeNull();
```

### Error Handling

- Always test both success and failure scenarios
- Use consistent error message expectations
- Handle cleanup in `finally` blocks
- Log meaningful error context in test failures

## Data Factory Usage

### Creating Test Data

Use the test data factory for consistent data creation:

```typescript
// Create users
const owner = await createTestUser();
const member = await createTestUser({ fullName: "Custom Name" });

// Create tenants
const tenant = await createTestTenant(owner.id);

// Create entities
const group = await createTestGroup(tenant.id, { name: "Custom Group" });
const resource = await createTestResource(tenant.id, { url: "https://custom.com" });
const event = await createTestEvent(tenant.id, owner.id, { visibility: "public" });
```

### Cleanup Patterns

```typescript
// Always cleanup in reverse order of dependencies
try {
  // Test logic
} finally {
  await cleanupTestTenant(tenant.id); // This cascades to related entities
  await cleanupTestUser(owner.id);
  await cleanupTestUser(member.id);
}
```

## Configuration Options

### RLS Test Suite Options

```typescript
interface RLSTestOptions {
  entityName: string; // Display name for the entity
  tableName: string; // Database table name
  createEntityFn?: Function; // Entity creation function
  additionalEntityData?: Record<string, unknown>; // Extra data for creation
  skipOwnerTests?: boolean; // Skip owner-related tests
  skipMemberTests?: boolean; // Skip member-related tests
  skipAnonymousTests?: boolean; // Skip anonymous user tests
  skipOutsiderTests?: boolean; // Skip outsider tests
}
```

### Environment Setup

Tests require specific environment variables:

- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Anonymous key for client operations
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for admin operations

## Performance Guidelines

### Test Execution

- Keep individual tests under 10 seconds when possible
- Use parallel test execution carefully (currently set to `maxWorkers: 1`)
- Cleanup test data promptly to avoid database bloat

### Data Generation

- Reuse test data factories for consistency
- Generate minimal data needed for each test
- Use meaningful but predictable test data

## Common Patterns

### Testing Limits and Constraints

```typescript
it("should enforce tenant group limit", async () => {
  const defaultTier = await getDefaultPriceTier();

  // Create entities up to the limit
  for (let i = 0; i < defaultTier.group_limit; i++) {
    // Create entity
  }

  // Try to exceed limit (should fail)
  const { data, error } = await createOneMore();
  expect(error).toBeDefined();
});
```

### Testing Cascading Deletes

```typescript
it("should automatically remove related entities when parent is deleted", async () => {
  // Create parent and child entities
  // Delete parent
  // Verify children are also deleted
});
```

### Testing Visibility Rules

```typescript
it("should respect entity visibility settings", async () => {
  // Create public and private entities
  // Test access with different user types
  // Verify visibility rules are enforced
});
```

## Running Tests

```bash
# Run all tests
npm run test

# Run specific test file
npm run test -- tests/rls/groups.rls.test.ts

# Run tests matching a pattern
npm run test -- --testPathPattern="refactored"

# Run tests in watch mode
npm run test -- --watch
```

## Automated RLS Test Runner

The project includes a unified automated test runner script (`run-rls-tests.sh`) that works in both local development and CI environments, automatically adapting its behavior based on the context.

### Features

- **Environment Detection**: Automatically detects CI vs local environment
- **Supabase CLI Compatibility**: Works with global, npm, or direct installations
- **Automatic Supabase Management**: Checks if Supabase is running and starts it if needed (local only)
- **Environment Configuration**: Creates and updates `.env.test` with proper configuration (local only)
- **API Key Management**: Automatically extracts and updates API keys from running Supabase instance (local only)
- **Flexible Test Execution**: Supports various test modes (coverage, watch, specific files)
- **CI Optimization**: Uses `--maxWorkers=1` and streamlined output in CI environments
- **Cross-Platform Support**: Works on both macOS and Linux

### Usage

**Local Development:**

```bash
# Basic usage - runs all RLS tests
./tests/run-rls-tests.sh

# Run with coverage reporting
./tests/run-rls-tests.sh --coverage

# Run in watch mode for development
./tests/run-rls-tests.sh --watch

# Run specific test file
./tests/run-rls-tests.sh groups.rls.test.ts
```

**CI Environment:**

```bash
# Automatically detects CI and adapts behavior
./tests/run-rls-tests.sh

# Coverage in CI
./tests/run-rls-tests.sh --coverage
```

### Adaptive Behavior

**Local Development Mode:**

1. **Environment Setup**: Creates `.env.test` if it doesn't exist, uses `.env.test.example` as template if available
2. **Supabase Management**: Checks if Supabase is running, starts it if needed, displays full status
3. **API Key Management**: Extracts current API keys from running Supabase, updates `.env.test` with actual keys, creates backup before updates
4. **Interactive Features**: Supports watch mode, full status display, interactive prompts

**CI Environment Mode:**

1. **Environment Verification**: Validates required environment variables are set
2. **Service Check**: Expects Supabase to already be running, fails if not available
3. **Optimized Output**: Shows abbreviated status for cleaner CI logs
4. **Performance**: Uses `--maxWorkers=1` for stability, disables interactive features
5. **Error Handling**: Provides streamlined error messages suitable for CI logs

### Supabase CLI Detection

The script automatically detects and uses the appropriate Supabase CLI installation:

- **Global Installation**: Uses `supabase` command directly
- **npm Installation**: Uses `npx supabase` for npm-installed CLI
- **Fallback**: Provides clear instructions if CLI is not found

This follows the [official Supabase CLI installation guide](https://supabase.com/docs/guides/local-development/cli/getting-started) and supports all recommended installation methods.

## Best Practices Summary

1. **Always use the RLS test base class** for standard CRUD operations
2. **Write custom tests only for business logic** that differs from standard patterns
3. **Use consistent test context management** with setup/cleanup patterns
4. **Follow naming conventions** for test descriptions and file organization
5. **Test both success and failure scenarios** for comprehensive coverage
6. **Keep tests isolated and independent** to avoid interference
7. **Use meaningful test data** that reflects real-world scenarios
8. **Document complex test logic** with comments when necessary
9. **Maintain consistent assertion patterns** across all tests
10. **Cleanup test data properly** to prevent interference between tests

This structure ensures maintainable, consistent, and comprehensive test coverage while minimizing code duplication and maximizing developer productivity.
