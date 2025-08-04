name: "Member Management Direct Addition PRP - Remove Invites, Add Direct Member Addition"
description: |

## Purpose

Replace the current invite-based member management system with direct member addition functionality for tenant owners. This PRP provides comprehensive context for removing the invitation system and implementing direct user addition with role selection while maintaining all existing RLS policies and tenant isolation.

## Core Principles

1. **Context is King**: Complete codebase patterns, service functions, and UI component structures included
2. **Validation Loops**: Executable tests and linting provided for iterative refinement
3. **Information Dense**: Specific file paths, existing patterns, and integration points
4. **Progressive Success**: Start with service layer, validate, then implement UI changes
5. **Global rules**: Follow all conventions in CLAUDE.md and existing member management patterns

---

## Goal

Transform member management from invitation-based to direct addition system, allowing tenant owners to directly add users as members or owners without requiring email invitations or token-based flows.

## Why

- **Business value**: Streamlined member onboarding process eliminates invitation friction
- **User experience**: Immediate member addition without waiting for email confirmations
- **Administrative efficiency**: Tenant owners can manage membership directly in real-time
- **Simplified architecture**: Removes complex invitation token system and email dependencies

## What

Replace invitation dialog and email-based flows with direct member addition form that creates users and assigns them to tenants immediately. Tenant owners can add users with email and role selection, with system creating profiles automatically.

### Success Criteria

- [ ] Invitation system completely removed (MemberInviteDialog, invite service functions)
- [ ] Direct member addition form implemented with email + role selection
- [ ] New members added directly to tenant without invitation tokens
- [ ] All existing RLS policies maintained and working
- [ ] Role assignment (member/owner) functions correctly
- [ ] All tests updated and passing (UI and RLS)
- [ ] Translation keys updated for new functionality

## All Needed Context

### Documentation & References

```yaml
# MUST READ - Include these in your context window
- url: https://supabase.com/docs/guides/auth/managing-user-data
  why: Official Supabase user management patterns and best practices
  section: User creation, profile management, and auth integration
  critical: Edge functions for auth user creation, automatic profile triggers

- url: https://supabase.com/docs/guides/auth/users
  why: Complete Supabase auth users documentation
  section: User CRUD operations, security considerations
  critical: Primary key references, foreign key stability

- url: https://www.freecodecamp.org/news/react-form-validation-zod-react-hook-form/
  why: React Hook Form + Zod validation patterns for new member addition form
  section: Complete form setup with zodResolver integration

- url: https://wasp.sh/blog/2024/11/20/building-react-forms-with-ease-using-react-hook-form-and-zod
  why: 2024 best practices for React forms with shadcn/ui integration
  critical: TypeScript-first approach and error handling patterns

- file: /Users/schwanndenkuo/Documents/personal/chabod/src/components/Members/MemberInviteDialog.tsx
  why: Current invite dialog structure to replace with direct addition form
  critical: Form layout, validation patterns, state management to replicate

- file: /Users/schwanndenkuo/Documents/personal/chabod/src/lib/member-service.ts
  why: Current service functions, including invite functions to remove
  critical: Service function patterns to maintain for new direct addition

- file: /Users/schwanndenkuo/Documents/personal/chabod/src/lib/membership-service.ts
  why: associateUserWithTenant function to use for direct member addition
  critical: Tenant association logic without invite tokens

- file: /Users/schwanndenkuo/Documents/personal/chabod/src/lib/services/service-core.ts
  why: Advanced service patterns for associations and error handling
  critical: Promise.all parallel execution, specific error message prefixes

- file: /Users/schwanndenkuo/Documents/personal/chabod/src/pages/tenant/MembersPage.tsx
  why: Member management page structure and state management patterns
  critical: Component integration patterns and data refresh logic

- file: /Users/schwanndenkuo/Documents/personal/chabod/tests/rls/tenant-members.rls.test.ts
  why: Comprehensive RLS test patterns that must continue to pass
  critical: Owner permission tests for member addition (already cover this case)

- file: /Users/schwanndenkuo/Documents/personal/chabod/tests/helpers/test-data-factory.ts
  why: Test user creation patterns and profile management
  critical: Service role client usage, profile creation/verification

- file: /Users/schwanndenkuo/Documents/personal/chabod/tests/ui/pages/tenant/MembersPage.test.tsx
  why: UI testing patterns for member management functionality
  critical: Testing approach for new member addition dialog

- file: /Users/schwanndenkuo/Documents/personal/chabod/CLAUDE.md
  why: Development patterns, testing commands, and architectural standards
  section: Form handling, UI patterns, internationalization guidelines

- file: /Users/schwanndenkuo/Documents/personal/chabod/supabase/migrations/20250509034800_create_user.sql
  why: Database user creation function patterns
  critical: Direct auth.users insertion patterns and security considerations
```

### Current Codebase Member Management Architecture

**Components to Remove:**

- `src/components/Members/MemberInviteDialog.tsx` - **COMPLETE REMOVAL**

**Components to Modify:**

```bash
src/pages/tenant/MembersPage.tsx           # Replace invite dialog with new addition dialog
src/components/Members/MemberTable.tsx     # Potential refresh logic updates
```

**Service Functions to Remove:**

```typescript
// From src/lib/member-service.ts - REMOVE THESE FUNCTIONS:
-inviteMemberToTenant(tenantSlug, email, role) -
  inviteUserToTenant(tenantId, email, role) -
  // From src/lib/membership-service.ts - MODIFY THIS FUNCTION:
  associateUserWithTenant(); // Remove invite token logic, keep direct association
```

**Current Member Addition Pattern (to Replace):**

```typescript
// CURRENT: Invitation-based flow
1. User fills invitation form (email + role)
2. inviteMemberToTenant() creates invitation record
3. Email sent with token
4. Invited user clicks link and registers
5. associateUserWithTenant() processes token and adds to tenant

// NEW: Direct addition flow
1. Owner fills member addition form (email + role)
2. addMemberToTenant() creates user if needed + adds to tenant directly
3. User can sign in immediately with existing auth flows
```

### **ENHANCED: Database Schema & RLS Policy Details**

**Critical Database Functions:**

```sql
-- User creation function (from supabase/migrations/20250509034800_create_user.sql)
CREATE OR REPLACE FUNCTION public.create_user(user_id uuid, email text, password text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, ...)
  VALUES ('00000000-0000-0000-0000-000000000000', user_id, 'authenticated', 'authenticated', email, extensions.crypt(password, extensions.gen_salt('bf')), ...);
END;
$$;

-- Tenant user limit enforcement
CREATE OR REPLACE FUNCTION public.check_tenant_user_limit(tenant_uuid uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
-- Enforces user limits based on price tier
$$;

-- Owner permission check
CREATE OR REPLACE FUNCTION public.is_tenant_owner(tenant_uuid uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
-- Verifies current user is tenant owner
$$;
```

**Critical RLS Policies:**

```sql
-- Tenant member insertion requires BOTH owner role AND user limit check
CREATE POLICY "Tenant owners can insert tenant members" ON "public"."tenant_members"
FOR INSERT WITH CHECK (
  "public"."is_tenant_owner"("tenant_id") AND
  "public"."check_tenant_user_limit"("tenant_id")
);
```

### **ENHANCED: Advanced Service Patterns**

**Parallel Association Pattern (from service-core.ts):**

```typescript
// Pattern: Use Promise.all for batch operations with specific error prefixes
await Promise.all([
  ...adminUserIds.map((userId) =>
    supabase
      .from("service_admins")
      .insert({ service_id: newService.id, user_id: userId })
      .then(({ error }) => {
        if (error) throw new Error(`Error adding service admin: ${error.message}`);
      }),
  ),
]);
```

**Standard Error Handling Pattern:**

```typescript
// Pattern: PGRST116 is standard "not found" error code
if (error?.code === "PGRST116") {
  // Not found
  return null; // or appropriate not found handling
}

// Pattern: Specific error message prefixes for different operations
throw new Error(`Error adding tenant member: ${error.message}`);
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: RLS policies require BOTH is_tenant_owner() AND check_tenant_user_limit()
// Both functions must return true for member insertion to succeed

// GOTCHA: User profiles are created automatically via database triggers
// BUT test data factory shows manual profile creation/verification needed for reliability

// CRITICAL: Database create_user() function directly inserts into auth.users
// This is the ONLY way to create auth users from service functions

// PATTERN: All forms use React Hook Form + Zod + zodResolver
import { zodResolver } from "@hookform/resolvers/zod";

// PATTERN: Success/error states use toast notifications
import { toast } from "@/hooks/use-toast";

// PATTERN: Loading states disable form submission
const [isLoading, setIsLoading] = useState(false);

// CRITICAL: Use existing associateUserWithTenant but without invite token
// Function already handles creating users that don't exist
await associateUserWithTenant(user.id, tenantId, role); // No token parameter

// GOTCHA: Standard error code for not found is PGRST116
if (error?.code === "PGRST116") return null;

// PATTERN: Error messages use specific prefixes for operation types
throw new Error(`Error adding tenant member: ${error.message}`);
```

### **ENHANCED: Missing Translation Keys Analysis**

**Translation Files Need These Missing Keys:**

```json
// public/locales/en/members.json - MISSING KEYS TO ADD:
{
  "addMemberToTenant": "Add Member to Tenant",
  "createNewMember": "Create New Member",
  "memberAddedSuccess": "Member has been added successfully.",
  "memberCreationError": "Error creating member",
  "userAlreadyExists": "A user with this email already exists",
  "password": "Password",
  "confirmPassword": "Confirm Password",
  "passwordMismatch": "Passwords do not match",
  "passwordMinLength": "Password must be at least 8 characters"
}

// public/locales/zh-TW/members.json - MISSING KEYS TO ADD:
{
  "addMemberToTenant": "新增成員到租戶",
  "createNewMember": "建立新成員",
  "memberAddedSuccess": "成員已成功新增",
  "memberCreationError": "建立成員時發生錯誤",
  "userAlreadyExists": "此電子郵件的用戶已存在",
  "password": "密碼",
  "confirmPassword": "確認密碼",
  "passwordMismatch": "密碼不相符",
  "passwordMinLength": "密碼必須至少8個字符"
}
```

## Implementation Blueprint

### New Components to Create

```bash
src/components/Members/
├── MemberAddDialog.tsx               # New direct member addition dialog
└── (Optional) MemberAddForm.tsx      # Separate form component if complex
```

### Modified Components

```bash
src/pages/tenant/MembersPage.tsx      # Replace MemberInviteDialog usage
src/lib/member-service.ts             # Remove invite functions, add direct addition
src/lib/membership-service.ts         # Clean up invite token logic
```

### Updated Tests

```bash
tests/ui/components/Members/
├── MemberAddDialog.test.tsx          # New component tests
└── (Remove) MemberInviteDialog.test.tsx   # Delete old tests

tests/ui/pages/tenant/MembersPage.test.tsx # Update to test new dialog
```

### Translation Updates

```bash
public/locales/en/members.json        # Update member management terms
public/locales/zh-TW/members.json     # Update Chinese translations
```

### **ENHANCED: List of Tasks to Complete (In Order)**

```yaml
Task 1 - Remove Invitation Service Functions:
MODIFY src/lib/member-service.ts:
  - REMOVE function: inviteMemberToTenant()
  - REMOVE function: inviteUserToTenant()
  - REMOVE import: uuid (v4 as uuidv4)
  - KEEP all other functions (getTenantMembers, updateTenantMember, deleteTenantMember, checkUserTenantAccess)

Task 2 - Add Direct Member Addition Service Function:
MODIFY src/lib/member-service.ts:
  - ADD function: addMemberToTenant(tenantSlug, email, role)
  - USE pattern from existing getTenantBySlug() for tenant lookup
  - HANDLE user creation via create_user() database function
  - USE Promise.all pattern for parallel operations (user creation + tenant association)
  - IMPLEMENT PGRST116 error code handling for not found scenarios
  - USE specific error message prefixes: "Error adding tenant member: ${error.message}"

Task 3 - Clean Up Membership Service:
MODIFY src/lib/membership-service.ts:
  - REMOVE invitation token logic from associateUserWithTenant()
  - KEEP user creation logic (handles non-existent users)
  - SIMPLIFY function to only handle direct user-tenant association
  - PRESERVE all role assignment and profile creation logic
  - ENSURE RLS policy compliance (both is_tenant_owner AND check_tenant_user_limit)

Task 4 - Create New Member Addition Dialog:
CREATE src/components/Members/MemberAddDialog.tsx:
  - MIRROR structure from MemberInviteDialog.tsx
  - USE React Hook Form + Zod validation pattern
  - ADD password/confirmPassword fields for new user creation
  - IMPLEMENT conditional validation (password required for new users only)
  - REPLACE "invite" terminology with "add member" terminology
  - KEEP same email + role selection UI structure
  - MAINTAIN same onSuccess callback pattern
  - USE new addMemberToTenant service function
  - IMPLEMENT advanced Zod schema pattern from service forms

Task 5 - Update Members Page:
MODIFY src/pages/tenant/MembersPage.tsx:
  - REPLACE MemberInviteDialog import with MemberAddDialog
  - UPDATE state variable names (isInviteDialogOpen → isAddDialogOpen)
  - UPDATE button text and handlers
  - PRESERVE all existing functionality (filtering, table, permissions)
  - MAINTAIN owner role checking for dialog access
  - ADD refresh logic after successful member addition

Task 6 - Remove Old Invite Dialog:
DELETE src/components/Members/MemberInviteDialog.tsx:
  - COMPLETE file removal
  - VERIFY no other components import this dialog
  - CHECK for any references in routing or lazy loading

Task 7 - **ENHANCED: Update Translation Keys**:
MODIFY public/locales/en/members.json:
  - REPLACE: "inviteMember" → "addMember"
  - REPLACE: "inviteMemberDesc" → "addMemberDesc"
  - ADD: "addMember": "Add Member"
  - ADD: "addMemberDesc": "Add a new member to this tenant"
  - ADD: "addingMember": "Adding member..."
  - ADD: "addMemberSuccess": "Member added successfully"
  - ADD: "addMemberToTenant": "Add Member to Tenant"
  - ADD: "createNewMember": "Create New Member"
  - ADD: "memberAddedSuccess": "Member has been added successfully."
  - ADD: "memberCreationError": "Error creating member"
  - ADD: "userAlreadyExists": "A user with this email already exists"
  - ADD: "password": "Password"
  - ADD: "confirmPassword": "Confirm Password"
  - ADD: "passwordMismatch": "Passwords do not match"
  - ADD: "passwordMinLength": "Password must be at least 8 characters"
  - REMOVE invitation-related keys

MODIFY public/locales/zh-TW/members.json:
  - IMPLEMENT all corresponding Chinese translations
  - FOLLOW same key structure as English

Task 8 - **ENHANCED: Create Member Addition Dialog Tests**:
CREATE tests/ui/components/Members/MemberAddDialog.test.tsx:
  - MIRROR test structure from MemberInviteDialog tests
  - USE test patterns from tests/helpers/test-data-factory.ts
  - TEST form validation (email required, valid email format)
  - TEST password validation for new users
  - TEST role selection (member/owner radio buttons)
  - TEST loading states during submission
  - TEST success callback execution
  - TEST error handling and toast notifications (PGRST116 scenarios)
  - TEST existing user vs new user creation paths
  - MOCK addMemberToTenant service function
  - USE mockUseSessionHelpers.authenticated() for auth state

Task 9 - Update Members Page Tests:
MODIFY tests/ui/pages/tenant/MembersPage.test.tsx:
  - UPDATE dialog opening tests (invite → add member)
  - UPDATE button text assertions
  - VERIFY owner-only access to add member functionality
  - TEST member list refresh after successful addition
  - TEST tenant user limit enforcement scenarios
  - REMOVE invitation-related test scenarios
  - ADD tests for password field visibility logic

Task 10 - Remove Old Invitation Tests:
DELETE tests/ui/components/Members/MemberInviteDialog.test.tsx:
  - COMPLETE file removal
  - UPDATE test imports in any other files if needed
  - VERIFY no test utilities or mocks are broken

Task 11 - **ENHANCED: Integration Testing**:
RUN comprehensive tests to ensure:
  - All RLS policies still pass (members can be added by owners)
  - Tenant user limit enforcement works correctly
  - UI tests pass with new component
  - No broken imports or missing components
  - Member addition works end-to-end for both existing and new users
  - Profile creation triggers work correctly
  - Password validation works for new user creation
  - Translation keys display correctly in both languages
```

### **ENHANCED: Implementation Pseudocode**

```typescript
// Task 2: New Service Function with Enhanced Error Handling
export async function addMemberToTenant(
  tenantSlug: string,
  email: string,
  role: string = "member",
  password?: string // Optional for existing users
): Promise<void> {
  try {
    // PATTERN: Follow existing getTenantBySlug pattern
    const tenant = await getTenantBySlug(tenantSlug);

    if (!tenant) {
      throw new Error(`Tenant "${tenantSlug}" not found`);
    }

    // Check if user already exists
    const { data: existingUser, error: userError } = await supabase.auth.admin.getUserByEmail(email);

    if (userError && userError.code !== "PGRST116") {
      throw new Error(`Error checking existing user: ${userError.message}`);
    }

    let userId: string;

    if (!existingUser && password) {
      // Create new user using database function pattern
      const newUserId = crypto.randomUUID();

      const { error: createError } = await supabase.rpc('create_user', {
        user_id: newUserId,
        email: email,
        password: password
      });

      if (createError) {
        throw new Error(`Error creating user: ${createError.message}`);
      }

      userId = newUserId;
    } else if (existingUser) {
      userId = existingUser.id;
    } else {
      throw new Error("Password required for new user creation");
    }

    // REUSE: Existing associateUserWithTenant function (cleaned up version)
    await associateUserWithTenant(userId, tenant.id, role);

  } catch (error) {
    // PATTERN: Specific error message prefix
    throw new Error(`Error adding tenant member: ${error.message}`);
  }
}

// Task 3: Simplified Membership Service (Remove invite token logic)
export async function associateUserWithTenant(
  userId: string,
  tenantId: string,
  role: string = "member"
): Promise<void> {
  try {
    // CRITICAL: RLS policy requires BOTH is_tenant_owner() AND check_tenant_user_limit()
    const { data, error } = await supabase
      .from("tenant_members")
      .insert({
        tenant_id: tenantId,
        user_id: userId,
        role,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        throw new Error("Tenant not found or access denied");
      }
      throw new Error(error.message);
    }

    // Profile creation happens automatically via database triggers
    // But verify profile exists for reliability (pattern from test-data-factory.ts)
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({
        id: userId,
        // Profile fields will be populated from auth.users automatically
      }, { onConflict: "id" });

    if (profileError) {
      console.warn(`Profile verification warning: ${profileError.message}`);
      // Don't throw - profile creation is automatic, this is just verification
    }

    return data;
  } catch (error) {
    throw new Error(`Error associating user with tenant: ${error.message}`);
  }
}

// Task 4: **ENHANCED** Member Addition Dialog with Password Support
const memberAddSchema = (t: (key: string) => string) =>
  z.object({
    email: z.string()
      .min(1, t("members:emailRequired"))
      .email(t("members:pleaseEnterValidEmail")),
    role: z.enum(["member", "owner"]),
    isNewUser: z.boolean(),
    password: z.string().optional(),
    confirmPassword: z.string().optional(),
  })
  .refine((data) => {
    if (data.isNewUser && (!data.password || data.password.length < 8)) {
      return false;
    }
    return true;
  }, {
    message: t("members:passwordMinLength"),
    path: ["password"],
  })
  .refine((data) => {
    if (data.isNewUser && data.password !== data.confirmPassword) {
      return false;
    }
    return true;
  }, {
    message: t("members:passwordMismatch"),
    path: ["confirmPassword"],
  });

export function MemberAddDialog({ isOpen, onClose, tenantSlug, onAddSuccess }: Props) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [isCheckingUser, setIsCheckingUser] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);

  const form = useForm<z.infer<typeof memberAddSchema>>({
    resolver: zodResolver(memberAddSchema(t)),
    defaultValues: {
      email: "",
      role: "member",
      isNewUser: false,
      password: "",
      confirmPassword: "",
    },
  });

  // Check if user exists when email changes
  const watchEmail = form.watch("email");
  useEffect(() => {
    const checkUserExists = async () => {
      if (!watchEmail || !watchEmail.includes("@")) return;

      setIsCheckingUser(true);
      try {
        const { data: existingUser } = await supabase.auth.admin.getUserByEmail(watchEmail);
        const userExists = !!existingUser;
        setIsNewUser(!userExists);
        form.setValue("isNewUser", !userExists);
      } catch (error) {
        setIsNewUser(true);
        form.setValue("isNewUser", true);
      } finally {
        setIsCheckingUser(false);
      }
    };

    const timeoutId = setTimeout(checkUserExists, 500); // Debounce
    return () => clearTimeout(timeoutId);
  }, [watchEmail, form]);

  const onSubmit = async (values: z.infer<typeof memberAddSchema>) => {
    setIsAdding(true);
    try {
      await addMemberToTenant(
        tenantSlug,
        values.email,
        values.role,
        values.isNewUser ? values.password : undefined
      );

      toast({
        title: t("members:addMemberSuccess"),
        description: t("members:memberAddedSuccess", { email: values.email }),
      });

      form.reset();
      onAddSuccess();
      onClose();
    } catch (error) {
      toast({
        title: t("members:addMemberError"),
        description: error.message || t("members:unknownError"),
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("members:addMember")}</DialogTitle>
          <DialogDescription>{t("members:addMemberDesc")}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Email Field */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("members:emailAddress")}</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="example@email.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                  {isCheckingUser && (
                    <p className="text-sm text-muted-foreground">
                      {t("members:checkingUser")}
                    </p>
                  )}
                  {isNewUser && (
                    <p className="text-sm text-blue-600">
                      {t("members:createNewMember")}
                    </p>
                  )}
                </FormItem>
              )}
            />

            {/* Password Fields (conditionally shown for new users) */}
            {isNewUser && (
              <>
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("members:password")}</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("members:confirmPassword")}</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {/* Role Selection */}
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("members:role")}</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="member" id="member" />
                        <Label htmlFor="member">{t("members:generalMember")}</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="owner" id="owner" />
                        <Label htmlFor="owner">{t("members:admin")}</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                {t("common:cancel")}
              </Button>
              <Button type="submit" disabled={isAdding || isCheckingUser}>
                {isAdding ? t("members:addingMember") : t("members:addMember")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
```

### Integration Points

```yaml
DATABASE_TABLES:
  - tenant_members: Direct inserts by owners (RLS already allows this)
  - auth.users: New user creation via create_user() database function
  - profiles: Auto-created via triggers, manual verification for reliability
  - invitations: Table can remain but won't be used (remove if desired)

RLS_POLICIES:
  - tenant_members INSERT: Requires BOTH is_tenant_owner() AND check_tenant_user_limit()
  - All other policies remain unchanged
  - No new RLS policies needed

USER_CREATION:
  - New users created via create_user() database function
  - Existing users looked up via supabase.auth.admin.getUserByEmail()
  - Profile creation handled automatically via database triggers
  - Manual profile verification recommended for reliability

TENANT_ASSOCIATION:
  - Direct insertion into tenant_members table
  - No invitation tokens or email workflows
  - Immediate membership activation
  - User limit enforcement via check_tenant_user_limit() function

ERROR_HANDLING:
  - PGRST116 for not found scenarios
  - Specific error message prefixes for different operations
  - User creation errors handled separately from association errors
```

## **ENHANCED: Validation Loop**

### Level 1: Syntax & Style

```bash
# Run these FIRST - fix any errors before proceeding
npm run lint -- src/components/Members/MemberAddDialog.tsx --fix
npm run lint -- src/lib/member-service.ts --fix
npm run lint -- src/lib/membership-service.ts --fix
npm run format

# Expected: No errors. If errors, READ the error and fix.
```

### Level 2: Unit Tests

```bash
# Test new member addition dialog
npm run test:ui -- MemberAddDialog.test.tsx

# Test updated members page
npm run test:ui -- MembersPage.test.tsx

# Test service functions individually
npm run test:ui -- --testNamePattern="member-service"

# Test translation key functionality
npm run test:ui -- --testNamePattern="translation"

# If failing: Read error, understand root cause, fix code, re-run
# NEVER mock to pass - fix actual implementation
```

### Level 3: RLS Testing

```bash
# Verify RLS policies still work with direct member addition
npm run test:rls -- tenant-members.rls.test.ts

# Test tenant user limit enforcement
npm run test:rls -- --testNamePattern="user limit"

# Expected: All existing tests pass
# The "owners can add members" test already covers direct addition scenario
```

### Level 4: Integration Testing

```bash
# Start development server
npm run dev

# Manual test direct member addition:
# 1. Navigate to tenant members page as owner
# 2. Click "Add Member" button
# 3. Test existing user addition (email only)
# 4. Test new user creation (email + password)
# 5. Verify member appears in list immediately
# 6. Test role assignment (member vs owner)
# 7. Test user limit enforcement
# 8. Verify new user can sign in with created password
# 9. Test both languages for UI text
```

### Level 5: Full Test Suite

```bash
# Run all tests to ensure no regressions
npm run test

# Run lint and format for final cleanup
npm run lint && npm run format

# Expected: All tests pass
# If failing: New implementation broke existing functionality - fix it
```

## **ENHANCED: Final Validation Checklist**

- [ ] All tests pass: `npm run test`
- [ ] No linting errors: `npm run lint`
- [ ] No type errors: TypeScript compiler clean
- [ ] Invitation dialog completely removed
- [ ] Direct member addition works for existing users
- [ ] Direct member addition works for new users with password creation
- [ ] User limit enforcement works correctly
- [ ] Role assignment (member/owner) functions correctly
- [ ] Member list refreshes after addition
- [ ] Translation keys updated and working for both languages
- [ ] Password validation works for new user creation
- [ ] Manual testing successful on localhost
- [ ] RLS policies continue to work correctly
- [ ] Error handling covers all scenarios (PGRST116, user limits, etc.)
- [ ] Profile creation/verification works reliably

---

## Anti-Patterns to Avoid

- ❌ Don't keep any invitation-related code - complete removal required
- ❌ Don't create new RLS policies - existing ones already handle this case
- ❌ Don't skip user creation logic - use create_user() database function pattern
- ❌ Don't ignore user limit enforcement - check_tenant_user_limit() is required
- ❌ Don't change RLS test expectations - they already test the right scenarios
- ❌ Don't modify tenant association patterns - follow existing service patterns
- ❌ Don't forget translation updates - app is fully internationalized
- ❌ Don't break existing member management functionality - addition should be the only change
- ❌ Don't skip password validation for new users - security requirement
- ❌ Don't ignore PGRST116 error handling - standard pattern throughout codebase

## **ENHANCED: Expected Implementation Confidence Score: 9.7/10**

**Reasoning:**

- ✅ Complete context provided with specific file paths and removal targets
- ✅ Enhanced database schema and RLS policy understanding
- ✅ Advanced service patterns from service-core.ts analyzed and included
- ✅ Missing translation keys identified and documented
- ✅ Test patterns comprehensive with existing examples from test-data-factory.ts
- ✅ User creation patterns from database migrations included
- ✅ Error handling patterns (PGRST116) documented throughout
- ✅ Implementation tasks broken down into specific, actionable steps
- ✅ All integration points identified and documented (user limits, profile creation)
- ✅ Clear validation gates with executable commands
- ✅ Password validation and new user creation patterns included
- ✅ Comprehensive translation key analysis completed

**Minor Risk Factors:**

- User creation via database function requires proper auth handling
- Profile creation reliability needs manual verification pattern
- Translation key updates across multiple files require careful attention
- Password validation for new vs existing users needs conditional logic

**Mitigation:**

- Comprehensive testing strategy covers all integration scenarios
- Progressive implementation allows validation at each step
- Existing patterns provide proven foundation for new functionality
- Database function patterns already established in migrations
- RLS tests already validate the exact permissions needed
- Test data factory provides reliable user creation patterns
