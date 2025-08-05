name: "Tenant Metadata Implementation PRP"
description: |

## Purpose

Backend-only implementation of tenant metadata feature with comprehensive PostgreSQL schema, RLS policies, and testing for the multi-tenant chabod system.

## Core Principles

1. **Security First**: Comprehensive RLS policies ensuring tenant isolation
2. **Schema-Based**: PostgreSQL columns, not JSON storage
3. **Test-Driven**: Full RLS test coverage for all access patterns
4. **Pattern Following**: Mirror existing tenant-related implementations

---

## Goal

Add tenant metadata storage to support church administrative information with proper database schema, Row Level Security, cascading relationships, and comprehensive testing.

## Why

- **Business Value**: Churches need to store administrative information (tax ID, contact details, verification status)
- **Compliance**: Tax ID and verification status support legal/regulatory requirements
- **User Experience**: Contact information enables better communication and support
- **Data Integrity**: Proper schema and cascading ensures data consistency

## What

Backend implementation of tenant metadata with:

- PostgreSQL table with 7 specific metadata fields
- Foreign key relationship to tenant table with cascade delete
- RLS policies allowing tenant owners to manage tenant metadata
- RLS policies allowing all user (including anon user) to read tenant metadata
- Automatic metadata creation when tenant is created
- Comprehensive RLS testing coverage
- Updated seed data for development

### Success Criteria

- [ ] Migration creates `tenant_meta` table with proper schema
- [ ] RLS policies enforce owner-only access with tenant isolation
- [ ] Trigger automatically creates metadata record when tenant is created
- [ ] Cascade delete removes metadata when tenant is deleted
- [ ] All RLS tests pass (`npm run test:rls`)
- [ ] Seed data includes sample tenant metadata

## All Needed Context

### Documentation & References

```yaml
# MUST READ - Include these in your context window
- file: /Users/schwanndenkuo/Documents/personal/chabod/CLAUDE.md
  why: Development guidelines, testing commands, architecture patterns

- file: /Users/schwanndenkuo/Documents/personal/chabod/supabase/migrations/20250501000000_initial_tenants.sql
  why: Tenant table structure, RLS functions, and policy patterns to follow

- file: /Users/schwanndenkuo/Documents/personal/chabod/tests/rls/tenants.rls.test.ts
  why: RLS testing patterns, test setup, and assertion patterns

- file: /Users/schwanndenkuo/Documents/personal/chabod/supabase/seed.sql
  why: Seed data patterns for tenants, users, and price tiers

- file: /Users/schwanndenkuo/Documents/personal/chabod/src/integrations/supabase/types.ts
  why: Generated database types that will need updating after migration

- file: /Users/schwanndenkuo/Documents/personal/chabod/src/lib/types.ts
  why: Extended application types where TenantMeta type should be added
```

### Current Codebase Structure

```bash
chabod/
├── supabase/
│   ├── migrations/           # Migration files following YYYYMMDDHHMMSS_name.sql pattern
│   └── seed.sql             # Development seed data
├── tests/
│   └── rls/                 # RLS security tests using createRLSTest() pattern
├── src/
│   ├── integrations/supabase/
│   │   └── types.ts         # Generated database types
│   └── lib/
│       └── types.ts         # Extended application types
└── CLAUDE.md               # Development guidelines and commands
```

### Desired Codebase Changes

```bash
# New Files
supabase/migrations/YYYYMMDDHHMMSS_tenant_meta.sql  # Migration with schema + RLS
tests/rls/tenant-meta.rls.test.ts                   # Comprehensive RLS tests

# Modified Files
supabase/seed.sql                                   # Add tenant_meta seed data
src/integrations/supabase/types.ts                 # Auto-generated after migration
src/lib/types.ts                                    # Add TenantMeta types
```

### Known Gotchas & Critical Patterns

```sql
-- CRITICAL: Must use existing RLS functions for consistency
-- Pattern: is_tenant_owner() and is_tenant_member() already exist

-- CRITICAL: Migration naming follows timestamp pattern
-- Pattern: YYYYMMDDHHMMSS_descriptive_name.sql (get timestamp from date +%Y%m%d%H%M%S)

-- CRITICAL: Always include trigger for updated_at
-- Pattern: CREATE TRIGGER "set_tenant_meta_updated_at" BEFORE UPDATE...

-- CRITICAL: Foreign key with CASCADE DELETE for data integrity
-- Pattern: REFERENCES "public"."tenants"("id") ON DELETE CASCADE

-- CRITICAL: RLS policies must allow service_role full access
-- Pattern: TO "service_role" in all policies for admin operations

-- CRITICAL: Test cleanup must use try/finally blocks
-- Pattern: Always cleanup in RLS tests to prevent test pollution
```

## Implementation Blueprint

### Data Model Schema

```sql
-- Core tenant_meta table structure
CREATE TABLE IF NOT EXISTS public.tenant_meta (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  tenant_id uuid NOT NULL UNIQUE REFERENCES "public"."tenants"("id") ON DELETE CASCADE,
  tax_id text,                     -- 統一編號 (optional)
  contact_email text NOT NULL,     -- 聯絡電子郵件 (required)
  address text NOT NULL,           -- 地址 (required)
  website text,                    -- 網址 (optional)
  phone_number text,               -- 教會電話 (optional)
  verified boolean NOT NULL DEFAULT false,  -- 驗證通過 (required, default false)
  verified_time timestamptz,       -- 驗證通過時間 (optional)
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);
```

### Task List (Implementation Order)

```yaml
Task 1 - Create Migration File:
  CREATE supabase/migrations/[TIMESTAMP]_tenant_meta.sql:
    - FIND pattern: existing migration structure from 20250501000000_initial_tenants.sql
    - INCLUDE: Table schema, triggers, RLS policies, grants
    - PRESERVE: Existing RLS function patterns (is_tenant_owner)
    - ADD: Automatic metadata creation trigger when tenant is created

Task 2 - Create RLS Test File:
  CREATE tests/rls/tenant-meta.rls.test.ts:
    - MIRROR pattern: tests/rls/tenants.rls.test.ts structure
    - USE: createRLSTest() helper for test setup
    - TEST: Owner access, member restrictions, outsider blocking, cascade delete
    - PRESERVE: try/finally cleanup pattern

Task 3 - Update Seed Data:
  MODIFY supabase/seed.sql:
    - FIND pattern: existing tenant seed data structure
    - ADD: Sample tenant_meta records for existing tenants
    - PRESERVE: existing seed order and relationships

Task 4 - Verify Type Generation:
  CHECK src/integrations/supabase/types.ts:
    - PATTERN: Types auto-generate after migration runs
    - VERIFY: TenantMeta interface appears in generated types

Task 5 - Add Extended Types:
  MODIFY src/lib/types.ts:
    - FIND pattern: existing compound types like TenantWithUsage
    - ADD: TenantMeta base type and TenantWithMeta compound type
    - PRESERVE: existing type export structure
```

### Migration Implementation Details

```sql
-- Task 1 Pseudocode - Critical patterns to follow
BEGIN;

-- PATTERN: Create trigger function first
CREATE OR REPLACE FUNCTION "public"."set_tenant_meta_updated_at"()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- PATTERN: Auto-create metadata when tenant is created
CREATE OR REPLACE FUNCTION "public"."create_tenant_meta_on_tenant_insert"()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO "public"."tenant_meta" ("tenant_id", "contact_email", "address")
  VALUES (NEW.id, '', '');  -- Empty defaults for required fields
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- PATTERN: Table with proper constraints and references
CREATE TABLE IF NOT EXISTS public.tenant_meta (
  -- schema as defined above
);

-- PATTERN: Updated_at trigger
CREATE TRIGGER "set_tenant_meta_updated_at"
  BEFORE UPDATE ON "public"."tenant_meta"
  FOR EACH ROW EXECUTE FUNCTION "public"."set_tenant_meta_updated_at"();

-- PATTERN: Auto-creation trigger
CREATE TRIGGER "create_tenant_meta_on_tenant_creation"
  AFTER INSERT ON "public"."tenants"
  FOR EACH ROW EXECUTE FUNCTION "public"."create_tenant_meta_on_tenant_insert"();

-- PATTERN: RLS Policies following existing tenant pattern
CREATE POLICY "Allow all users to read tenant meta" ON "public"."tenant_meta"
  FOR SELECT USING (true);

CREATE POLICY "Only tenant owners can update tenant meta" ON "public"."tenant_meta"
  FOR UPDATE USING ("public"."is_tenant_owner"("tenant_id"));

-- PATTERN: Service role access for admin operations
CREATE POLICY "Service role can manage tenant meta" ON "public"."tenant_meta"
  FOR ALL TO "service_role" USING (true) WITH CHECK (true);

-- PATTERN: Enable RLS
ALTER TABLE "public"."tenant_meta" ENABLE ROW LEVEL SECURITY;

-- PATTERN: Grant permissions
GRANT ALL ON "public"."tenant_meta" TO "anon";
GRANT ALL ON "public"."tenant_meta" TO "authenticated";
GRANT ALL ON "public"."tenant_meta" TO "service_role";

COMMIT;
```

### RLS Test Implementation Pattern

```typescript
// Task 2 Pseudocode - Follow existing test patterns exactly
import { createRLSTest } from "../helpers/rls-test-base";
import { serviceRoleClient } from "../setup";

const rlsTest = createRLSTest();

describe("Tenant Meta RLS Policies", () => {
  beforeEach(async () => {
    await rlsTest.setupTestContext();
  });

  afterEach(async () => {
    await rlsTest.cleanupTestContext();
  });

  // PATTERN: Test owner access
  it("should allow tenant owners to read/update meta", async () => {
    const { owner, tenant } = rlsTest.getContext();

    try {
      // Test read access
      const { data: readData, error: readError } = await owner.client
        .from("tenant_meta")
        .select("*")
        .eq("tenant_id", tenant.id);

      expect(readError).toBeNull();
      expect(readData).toHaveLength(1);

      // Test update access
      const { error: updateError } = await owner.client
        .from("tenant_meta")
        .update({ website: "https://example.com" })
        .eq("tenant_id", tenant.id);

      expect(updateError).toBeNull();
    } finally {
      await rlsTest.cleanupTestContext();
    }
  });

  // PATTERN: Test member restrictions
  it("should prevent tenant members from updating meta", async () => {
    const { member, tenant } = rlsTest.getContext();

    try {
      const { error } = await member.client
        .from("tenant_meta")
        .update({ website: "https://hacker.com" })
        .eq("tenant_id", tenant.id);

      expect(error).not.toBeNull();
      expect(error.code).toBe("42501"); // Insufficient privilege
    } finally {
      await rlsTest.cleanupTestContext();
    }
  });

  // PATTERN: Test tenant isolation
  it("should prevent outsiders from accessing meta", async () => {
    const { outsider, tenant } = rlsTest.getContext();

    try {
      const { data, error } = await outsider.client
        .from("tenant_meta")
        .select("*")
        .eq("tenant_id", tenant.id);

      expect(data).toHaveLength(0); // Should see no data
    } finally {
      await rlsTest.cleanupTestContext();
    }
  });

  // PATTERN: Test cascade delete behavior
  it("should cascade delete meta when tenant is deleted", async () => {
    // Test using service role for admin operations
    const { tenant } = rlsTest.getContext();

    try {
      // Verify meta exists
      const { data: beforeData } = await serviceRoleClient
        .from("tenant_meta")
        .select("*")
        .eq("tenant_id", tenant.id);
      expect(beforeData).toHaveLength(1);

      // Delete tenant
      await serviceRoleClient.from("tenants").delete().eq("id", tenant.id);

      // Verify meta was cascade deleted
      const { data: afterData } = await serviceRoleClient
        .from("tenant_meta")
        .select("*")
        .eq("tenant_id", tenant.id);
      expect(afterData).toHaveLength(0);
    } finally {
      await rlsTest.cleanupTestContext();
    }
  });
});
```

### Integration Points

```yaml
DATABASE:
  - migration: "Create tenant_meta table with CASCADE foreign key"
  - trigger: "Auto-create metadata when tenant is created"
  - rls: "Owner-only access policies with tenant isolation"

TESTING:
  - rls_tests: "Comprehensive access control testing"
  - command: "npm run test:rls should pass all tests"

SEED_DATA:
  - add_to: supabase/seed.sql
  - pattern: "Insert sample tenant_meta for existing seed tenants"

TYPES:
  - auto_generated: src/integrations/supabase/types.ts (after migration)
  - manual_added: src/lib/types.ts (compound types)
```

## Validation Loop

### Level 1: Migration & Syntax

```bash
# Apply migration locally
supabase db reset

# Expected: No errors, tenant_meta table created with proper schema
# If errors: Check migration syntax, foreign key references, trigger functions
```

### Level 2: RLS Security Testing

```bash
# Run RLS tests specifically for new feature
npm run test:rls -- tenant-meta.rls.test.ts

# Expected: All tests pass
# If failing: Check RLS policies, function permissions, test setup/cleanup
```

### Level 3: Full Integration

```bash
# Run all RLS tests to ensure no regressions
npm run test:rls

# Expected: All existing and new tests pass
# If failing: Check for policy conflicts, migration issues, seed data problems
```

## Final Validation Checklist

- [ ] Migration applies cleanly: `supabase db reset`
- [ ] Table created with correct schema and constraints
- [ ] RLS policies enforce owner-only access
- [ ] Triggers create metadata automatically
- [ ] Cascade delete works properly
- [ ] New RLS tests pass: `npm run test:rls -- tenant-meta.rls.test.ts`
- [ ] All RLS tests pass: `npm run test:rls`
- [ ] Seed data includes sample metadata
- [ ] Types generated correctly after migration

---

## Anti-Patterns to Avoid

- ❌ Don't use JSON storage - use proper PostgreSQL columns
- ❌ Don't skip RLS policies - security is critical for multi-tenant
- ❌ Don't forget CASCADE DELETE - data consistency matters
- ❌ Don't skip test cleanup - polluted tests cause failures
- ❌ Don't create new RLS functions - use existing `is_tenant_owner()`
- ❌ Don't modify tenant table schema - use separate metadata table
- ❌ Don't skip automatic metadata creation trigger
- ❌ Don't forget service_role permissions for admin operations

## Confidence Score: 9/10

This PRP provides comprehensive context, follows established patterns exactly, includes all necessary security considerations, and provides executable validation steps. The only uncertainty is the exact timestamp for migration naming, but the pattern is clearly established.
