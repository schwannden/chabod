# RLS (Row Level Security) Tests

This directory contains comprehensive tests for Supabase Row Level Security policies that protect your application's data access patterns.

## Quick Start

```bash
# Run all RLS tests
./tests/rls/run-rls-tests.sh

# Run with coverage
./tests/rls/run-rls-tests.sh --coverage

# Run in watch mode
./tests/rls/run-rls-tests.sh --watch

# Run specific test file
./tests/rls/run-rls-tests.sh groups.rls.test.ts
```

## Overview

RLS tests ensure database security policies work correctly by testing data access permissions for different user roles. Every database operation is tested to verify users can only access data they're authorized to see or modify.

### Test Files

```
tests/rls/
├── README.md                   # This documentation
├── setup.ts                    # Global test configuration
├── run-rls-tests.sh           # Automated test runner
├── tenants.rls.test.ts        # Tenant security tests
├── groups.rls.test.ts         # Group security tests
├── resources.rls.test.ts      # Resource security tests
├── events.rls.test.ts         # Event security tests
├── services.rls.test.ts       # Service security tests
└── tenant-members.rls.test.ts # Tenant member security tests
```

## Writing RLS Tests

### Standard Test Pattern

Use the `RLSTestBase` class for consistent patterns:

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

### Required Test Coverage

Every entity must test these RLS patterns:

**Creation/Update/Delete Policies:**

- ✅ Owners can perform operations
- ✅ Members cannot perform operations (unless specified)
- ✅ Outsiders cannot perform operations
- ✅ Anonymous users cannot perform operations

**Select Policies:**

- ✅ Tenant members can view entities in their tenant
- ✅ Outsiders cannot view private entities

### Custom Business Logic Tests

For entity-specific rules:

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

## Test Context Management

Always use standardized context management:

```typescript
await rlsTest.setupTestContext();
try {
  const { owner, member, outsider, tenant } = rlsTest.getContext();
  // ... test logic
} finally {
  await rlsTest.cleanupTestContext();
}
```

## Environment Setup

Tests require these environment variables:

```bash
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Prerequisites:

- Docker (for Supabase services)
- Supabase CLI
- Node.js environment

## Automated Test Runner

The `run-rls-tests.sh` script automatically adapts to different environments:

**Local Development Features:**

- Creates `.env.test` from example if missing
- Starts Supabase automatically if not running
- Extracts and updates API keys
- Supports interactive features like watch mode

**CI Environment Features:**

- Expects Supabase to already be running
- Uses `--maxWorkers=1` for stability
- Streamlined output for cleaner CI logs

## Test Style Guidelines

### Test Descriptions

Follow pattern: "should [action] [expected result] [conditions]"

**Good examples:**

- ✅ `"should allow tenant owners to create groups"`
- ✅ `"should prevent members from deleting resources"`

**Avoid:**

- ❌ `"test group creation"` (too vague)

### Assertion Patterns

```typescript
// Success assertions
expect(error).toBeNull();
expect(data).toBeDefined();

// Failure assertions
expect(error).toBeDefined();
expect(data).toBeNull();
expect(error?.message).toContain("new row violates row-level security policy");

// Update/delete failures
expect(data).toEqual([]); // No rows affected

// Not found scenarios
expect(error?.code).toBe("PGRST116");
```

## Troubleshooting

### Common Issues

1. **Supabase not starting** → Check Docker and port availability
2. **API key extraction fails** → Verify Supabase is fully started
3. **Test timeouts** → Increase timeout values for slow environments
4. **Permission errors** → Ensure RLS policies are correctly implemented

### Debug Commands

```bash
# Check Supabase status
supabase status

# View logs
supabase logs

# Reset database
supabase db reset
```
