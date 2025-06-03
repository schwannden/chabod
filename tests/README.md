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

## Migration from Legacy Tests

### Before (Legacy Pattern)

```typescript
describe("Groups RLS Policies", () => {
  it("should allow tenant owners to create groups", async () => {
    const owner = await createTestUser();
    const tenant = await createTestTenant(owner.id);
    try {
      // 20+ lines of test logic
    } finally {
      await cleanupTestTenant(tenant.id);
      await cleanupTestUser(owner.id);
    }
  });
  // ... 20+ more similar tests
});
```

### After (Refactored Pattern)

```typescript
const rlsTest = createRLSTest();

// Generates all standard CRUD tests automatically
rlsTest.createStandardRLSTestSuite({
  entityName: "Group",
  tableName: "groups",
  createEntityFn: createTestGroup,
  additionalEntityData: { description: "Test group" },
});

// Only custom business logic needs manual testing
describe("Groups RLS Policies - Custom Tests", () => {
  it("should enforce tenant group limit", async () => {
    // Custom test implementation
  });
});
```

## Benefits of Current Structure

### Code Reduction

- **Before**: ~1000+ lines of duplicated test code across 5 files
- **After**: ~200 lines of reusable base class + minimal custom logic per entity
- **Reduction**: ~80% less code while maintaining same test coverage

### Consistency Benefits

- Standardized error handling across all tests
- Consistent test context management
- Uniform assertion patterns
- Predictable test structure

### Maintenance Benefits

- Bug fixes in test logic only need to be made in one place
- New RLS policies can be tested by calling `createStandardRLSTestSuite()`
- Custom tests focus only on entity-specific business logic
- Clear separation between standard and custom test patterns

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
