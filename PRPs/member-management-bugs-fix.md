# Member Management Bug Fixes PRP

## Goal

Fix three critical bugs in the member management system that are breaking core functionality:

1. **getUserByEmail Error**: Fix `q.auth.admin.getUserByEmail is not a function` error when adding members
2. **Silent OAuth Failure**: Show proper error messages when users sign in with Google but aren't tenant members
3. **Password Logic**: Don't require password for existing users when adding them to tenants

## Why

- **Business Critical**: Member addition functionality is completely broken due to admin API calls in client-side code
- **User Experience**: Users get confused by silent failures during Google OAuth when they lack tenant access
- **Security Best Practice**: Replace client-side admin API calls with secure database functions
- **Data Consistency**: Avoid creating duplicate users or requiring passwords for existing accounts

## What

### User-Visible Behavior Changes

1. **Fixed Member Addition**: Adding members via email now works reliably for both new and existing users
2. **Clear Error Messages**: Users signing in with Google see helpful error messages when they lack tenant access
3. **Smart Password Logic**: System only requests passwords for genuinely new user accounts
4. **Proper Access Control**: Database function ensures only tenant owners can look up user information

### Technical Requirements

- Replace `supabase.auth.admin.getUserByEmail()` with secure database function
- Add tenant membership validation error handling in OAuth flows
- Update member addition logic to handle existing users correctly
- Ensure proper RLS policies for new database function
- Add comprehensive test coverage for edge cases

### Success Criteria

- [ ] Member addition works without admin API errors
- [ ] Google OAuth shows clear error messages for non-members
- [ ] Password field only appears for genuinely new users
- [ ] All existing tests pass
- [ ] New RLS test covers database function security
- [ ] UI tests cover error message display

## All Needed Context

### Documentation & References

```yaml
# MUST READ - Include these in your context window
- url: https://www.reddit.com/r/Supabase/comments/1cfurdu/method_to_check_if_user_exists_with_an_email/
  why: Community solution showing database function approach for user lookups

- file: src/lib/member-service.ts:84
  why: Current broken implementation using admin API on client-side

- file: src/components/Members/MemberAddDialog.tsx:114
  why: UI component making the failing admin API call

- file: supabase/migrations/20250509034800_create_user.sql
  why: Pattern for security definer functions accessing auth.users

- file: src/pages/tenant/AuthPage.tsx:64-73
  why: Silent failure location for OAuth tenant membership validation

- file: tests/rls/tenant-members.rls.test.ts
  why: Pattern for testing tenant-specific database functions

- file: src/lib/membership-service.ts:36-77
  why: Pattern for associating users with tenants (reusable in fixes)
```

### Current Codebase Structure

```bash
src/
├── lib/
│   ├── member-service.ts          # BROKEN: Uses admin API (line 84)
│   ├── membership-service.ts      # WORKING: Tenant association logic
│   └── types.ts                   # Type definitions to extend
├── components/Members/
│   └── MemberAddDialog.tsx        # BROKEN: Calls failing service (line 114)
├── pages/tenant/
│   └── AuthPage.tsx              # MISSING: Error display for OAuth failures (line 67)
└── integrations/supabase/
    └── client.ts                  # Standard client (NOT admin)

supabase/migrations/
├── 20250509034800_create_user.sql # PATTERN: Security definer functions
└── [new] get_user_id_by_email.sql # TO CREATE: User lookup function

tests/
├── rls/tenant-members.rls.test.ts # PATTERN: RLS function testing
└── ui/components/Members/         # COVERAGE: Need error case tests
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: Supabase Admin API not available in client-side code
// Current ERROR: supabase.auth.admin.getUserByEmail(email)
// ❌ This runs in browser and fails with "not a function"

// PATTERN: Security definer functions for auth.users access
// ✅ Use database functions with SECURITY DEFINER like create_user.sql
// ✅ Call via supabase.rpc() instead of admin API

// GOTCHA: RLS policies must allow function execution by tenant owners
// PATTERN: Check existing check_tenant_user_limit for owner validation pattern

// CRITICAL: OAuth callback flow doesn't show user-facing errors
// Current: console.log() only (line 67 of AuthPage.tsx)
// Need: Toast notification or error state display

// PASSWORD LOGIC: Don't add password for existing users
// Check user existence BEFORE showing password fields
// Update form validation to make password optional for existing users
```

## Implementation Blueprint

### Database Function

Create secure user lookup function with proper RLS:

```sql
-- Migration: supabase/migrations/[timestamp]_get_user_id_by_email.sql
CREATE OR REPLACE FUNCTION public.get_user_id_by_email(p_email text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- CRITICAL: Only allow tenant owners to call this function
    -- Pattern from check_tenant_user_limit function
    IF NOT public.is_tenant_owner() THEN
        RAISE EXCEPTION 'Access denied: Only tenant owners can look up users';
    END IF;

    RETURN (
        SELECT id
        FROM auth.users
        WHERE email = p_email
        LIMIT 1
    );
END;
$$;

-- Grant execution to authenticated users (RLS handles authorization)
GRANT EXECUTE ON FUNCTION public.get_user_id_by_email(text) TO authenticated;
```

### Service Layer Changes

Replace admin API calls with database function:

```typescript
// src/lib/member-service.ts - MODIFY addMemberToTenant function
// REPLACE lines 82-88:
const { data: existingUser, error: userError } = await supabase.auth.admin.getUserByEmail(email); // ❌ REMOVE

// WITH:
const existingUserId = await supabase
  .rpc("get_user_id_by_email", {
    p_email: email,
  })
  .then(({ data, error }) => {
    if (error) {
      if (error.code === "P0001") {
        // Access denied
        throw new Error("Only tenant owners can add members");
      }
      console.error("Error checking user:", error);
      return null;
    }
    return data;
  });

const userExists = !!existingUserId;
```

### OAuth Error Handling

Add tenant membership error messages:

```typescript
// src/pages/tenant/AuthPage.tsx - MODIFY lines 64-73
if (hasAccess) {
  navigate(`/tenant/${slug}`);
} else if (!inviteToken) {
  // ADD: User-facing error message instead of console.log
  setError(t("auth:noPermissionToEnterChurch"));
  toast({
    title: t("auth:accessDenied"),
    description: t("auth:contactAdminForAccess", { tenantName }),
    variant: "destructive",
  });
}
```

### List of Tasks (Execution Order)

```yaml
Task 1: Create Database Function
MODIFY supabase/migrations/[new]_get_user_id_by_email.sql:
  - MIRROR pattern from: supabase/migrations/20250509034800_create_user.sql
  - COPY security definer setup and auth.users access pattern
  - ADD is_tenant_owner() authorization check
  - PRESERVE existing function naming conventions

Task 2: Update Member Service
MODIFY src/lib/member-service.ts:
  - FIND pattern: "supabase.auth.admin.getUserByEmail(email)" (line 84)
  - REPLACE with: "supabase.rpc('get_user_id_by_email', { p_email: email })"
  - PRESERVE existing error handling structure
  - KEEP associateUserWithTenant call pattern identical

Task 3: Fix Password Logic in UI
MODIFY src/components/Members/MemberAddDialog.tsx:
  - FIND pattern: "supabase.auth.admin.getUserByEmail(watchEmail)" (line 114)
  - REPLACE with: database function call
  - PRESERVE existing form validation patterns
  - KEEP password field conditional logic structure

Task 4: Add OAuth Error Display
MODIFY src/pages/tenant/AuthPage.tsx:
  - FIND pattern: "console.log('User is not a member')" (line 67)
  - INJECT error state and toast notification
  - PRESERVE existing navigation logic
  - MIRROR error handling pattern from other auth components

Task 5: Create RLS Test
CREATE tests/rls/get-user-id-by-email.rls.test.ts:
  - MIRROR pattern from: tests/rls/tenant-members.rls.test.ts
  - TEST tenant owner access allowed
  - TEST non-owner access denied
  - TEST function returns correct user ID

Task 6: Add UI Error Tests
CREATE tests/ui/pages/tenant/AuthPage.oauth-errors.test.tsx:
  - MIRROR pattern from: tests/ui/pages/tenant/AuthPage.test.tsx
  - TEST error message display for non-members
  - TEST toast notification shows
  - TEST user can retry or navigate away
```

### Integration Points

```yaml
DATABASE:
  - migration: "Add get_user_id_by_email function with RLS"
  - permission: "Grant execute to authenticated users"
  - security: "Restrict to tenant owners via is_tenant_owner()"

TRANSLATIONS:
  - add to: public/locales/en/auth.json
  - keys: "accessDenied", "contactAdminForAccess"
  - pattern: Follow existing error message format

SERVICES:
  - modify: src/lib/member-service.ts (replace admin API)
  - preserve: All existing function signatures and return types
  - enhance: Error handling for authorization failures
```

## Validation Loop

### Level 1: Syntax & Database

```bash
# Run migration and check function creation
npm run db:reset  # Apply all migrations including new function
npm run db:start  # Start local Supabase

# Verify function exists and has correct permissions
# Expected: Function created with SECURITY DEFINER and proper grants
```

### Level 2: RLS Security Tests

```bash
# Test database function security
./tests/rls/run-rls-tests.sh get-user-id-by-email.rls.test.ts

# Expected:
# ✅ Tenant owners can call function
# ✅ Non-owners get access denied error
# ✅ Function returns correct user ID for existing users
# ✅ Function returns null for non-existent users
```

### Level 3: Service Integration Tests

```bash
# Test member service with new database function
npm run test:ui -- --testPathPattern="Members.*test"

# Expected:
# ✅ Adding existing users works without password
# ✅ Adding new users requires password
# ✅ Admin API errors eliminated
# ✅ Proper error messages for unauthorized access
```

### Level 4: OAuth Flow Tests

```bash
# Test OAuth error handling
npm run test:ui -- --testPathPattern="AuthPage.*test"

# Expected:
# ✅ Non-member OAuth shows error message
# ✅ Toast notification appears
# ✅ User can see clear next steps
# ✅ No silent failures remain
```

## Final Validation Checklist

- [ ] All tests pass: `npm test`
- [ ] No linting errors: `npm run lint`
- [ ] Database migration applies cleanly: `npm run db:reset`
- [ ] Member addition works in UI: Manual test adding existing user
- [ ] OAuth errors show properly: Manual test with non-member Google account
- [ ] RLS policies prevent unauthorized access: RLS test suite passes
- [ ] No admin API calls remain in client code: Code search verification

## Confidence Score: 9/10

**High Confidence Factors:**

- Clear replication of existing patterns (security definer functions, RLS tests)
- Detailed analysis of current failures with specific line references
- Comprehensive validation loops covering security, functionality, and UX
- Well-established codebase with consistent patterns to follow

**Minor Risk Factor:**

- Need to verify exact `is_tenant_owner()` function implementation for RLS policy

---

## Anti-Patterns to Avoid

- ❌ Don't use admin API in client-side code (root cause of current bug)
- ❌ Don't skip RLS testing for database functions accessing auth.users
- ❌ Don't leave silent failures - always provide user feedback
- ❌ Don't create new error handling patterns when existing ones work
- ❌ Don't modify password logic without proper existing user detection
- ❌ Don't bypass tenant owner authorization in database functions
