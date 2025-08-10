# Reset Password Feature Implementation PRP

## Goal

Implement comprehensive password reset functionality across two key areas:

1. **Profile Page**: Allow users to set/change passwords with different flows for Google OAuth vs email/password users
2. **Auth Pages**: Complete the existing password reset email flow with password reset confirmation handling

## Why

- **User Security**: Enable users to manage their password credentials independently
- **OAuth Integration**: Provide password setting capability for users who initially signed up via Google OAuth
- **Security Best Practice**: Allow password updates for security maintenance
- **Complete Auth Flow**: Finalize existing partial password reset implementation

## What

### Success Criteria

- [ ] Profile page shows password change section for email/password users only
- [ ] Profile page shows password setup section for Google OAuth users
- [ ] Auth pages handle password reset confirmation tokens correctly
- [ ] Password reset emails respect Supabase rate limiting (2 emails/hour)
- [ ] All forms follow React Hook Form + Zod validation patterns
- [ ] Complete internationalization support (English/Chinese)
- [ ] Proper error handling and user feedback
- [ ] Security validation (password strength, confirmation matching)

## All Needed Context

### Documentation & References

```yaml
# MUST READ - Critical Supabase Auth Documentation
- url: https://supabase.com/docs/guides/auth/passwords
  why: updateUser method, password change patterns, security best practices

- url: https://supabase.com/docs/guides/auth/rate-limits
  why: Email rate limiting (2/hour), security considerations, custom SMTP setup

- url: https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail
  why: Existing password reset email method, redirect URL patterns

# EXISTING CODEBASE PATTERNS
- file: /src/components/Auth/SignInForm.tsx
  why: Existing password reset email implementation (lines 115-165), form patterns
  critical: Already has resetPasswordForEmail() - need to complete the flow

- file: /src/components/Profile/ProfileForm.tsx
  why: Existing profile form structure, card layout patterns
  critical: Need to add security section while preserving current layout

- file: /src/components/Auth/AuthPasswordInput.tsx
  why: Existing password input component with show/hide toggle
  critical: Use for consistent password input UX

- file: /src/components/Members/MemberAddDialog.tsx
  why: React Hook Form + Zod pattern with password confirmation
  critical: Mirror this validation pattern exactly

- file: /src/pages/AuthCallbackPage.tsx
  why: Auth callback handling for password reset tokens
  critical: Extends this to handle password reset confirmation

- file: /src/contexts/SessionContext.tsx
  why: User session management, profile refetching patterns
  critical: Determines if user is Google OAuth vs email/password user

- file: /src/lib/profile-service.ts
  why: Existing profile service patterns for database operations
  critical: Follow same service pattern for password operations
```

### Current Codebase Structure (Relevant Parts)

```bash
src/
├── components/
│   ├── Auth/
│   │   ├── SignInForm.tsx           # Has existing resetPasswordForEmail()
│   │   ├── AuthPasswordInput.tsx    # Reusable password input component
│   │   └── AuthTabs.tsx            # Root auth page component
│   └── Profile/
│       └── ProfileForm.tsx          # Needs security section addition
├── pages/
│   ├── AuthPage.tsx                 # Root auth page (/auth)
│   ├── AuthCallbackPage.tsx         # Needs password reset handling
│   ├── ProfilePage.tsx             # Profile page wrapper
│   └── tenant/
│       └── AuthPage.tsx            # Tenant auth page (/tenant/:slug/auth)
├── lib/
│   └── profile-service.ts          # Profile operations service
└── integrations/supabase/
    └── client.ts                   # Supabase client for auth operations
```

### Desired Implementation Structure

```bash
src/
├── components/
│   ├── Auth/
│   │   ├── SignInForm.tsx           # ENHANCE: Better UX for reset flow
│   │   └── ResetPasswordForm.tsx    # CREATE: Handle reset token confirmation
│   └── Profile/
│       ├── ProfileForm.tsx          # ENHANCE: Add security section
│       ├── PasswordChangeForm.tsx   # CREATE: Password change for existing users
│       └── PasswordSetupForm.tsx    # CREATE: Password setup for OAuth users
├── pages/
│   └── AuthCallbackPage.tsx         # ENHANCE: Handle password reset tokens
└── lib/
    └── auth-service.ts             # CREATE: Password operations service
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: Supabase Auth Patterns
// 1. updateUser() requires user to be signed in first
await supabase.auth.updateUser({ password: "new_password" });

// 2. Password reset flow automatically signs user in when token is clicked
// AuthCallbackPage.tsx needs to detect PASSWORD_RECOVERY event

// 3. Rate limiting: 2 emails per hour (reduced from 4 in Oct 2023)
// Show user-friendly error when rate limit hit

// 4. Authentication method detection (Supabase v2.53.0+)
const user = useSession().user;
const isGoogleUser = user?.identities?.some((identity) => identity.provider === "google");
const isEmailPasswordUser = user?.identities?.some((identity) => identity.provider === "email");

// 5. Form validation pattern used throughout codebase
const schema = z
  .object({
    password: z.string().min(8, t("auth:passwordMinLength")),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: t("auth:passwordMismatch"),
    path: ["confirmPassword"],
  });

// 6. Translation namespace convention
// Use 'auth' namespace for password-related keys
// Use 'profile' namespace for profile page keys
```

## Implementation Blueprint

### Task 1: Create Auth Service for Password Operations

```yaml
CREATE src/lib/auth-service.ts:
  - MIRROR pattern from: src/lib/profile-service.ts
  - ADD updatePassword function using supabase.auth.updateUser()
  - ADD error handling for auth failures
  - ADD TypeScript types for service responses
```

**Pseudocode:**

```typescript
// src/lib/auth-service.ts
export async function updateUserPassword(newPassword: string): Promise<void> {
  // PATTERN: Direct supabase client usage like profile-service.ts
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    // PATTERN: Throw descriptive errors like other services
    throw new Error(`Failed to update password: ${error.message}`);
  }
}
```

### Task 2: Create Password Change Form Component (Existing Password Users)

```yaml
CREATE src/components/Profile/PasswordChangeForm.tsx:
  - MIRROR validation pattern from: src/components/Members/MemberAddDialog.tsx
  - USE AuthPasswordInput component for consistent UX
  - IMPLEMENT React Hook Form + Zod with 3 fields: currentPassword, newPassword, confirmPassword
  - ADD password strength validation (min 8 chars)
  - ADD confirmation matching validation
  - USE shadcn Form components for consistent styling
```

**Pseudocode:**

```typescript
const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, t("auth:currentPasswordRequired")),
    newPassword: z.string().min(8, t("auth:passwordMinLength")),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: t("auth:passwordMismatch"),
    path: ["confirmPassword"],
  });

const handleSubmit = async (values) => {
  // SECURITY: Verify current password by attempting sign in
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: values.currentPassword,
  });

  if (verifyError) {
    // Show error: "Current password is incorrect"
    return;
  }

  // Update to new password
  await updateUserPassword(values.newPassword);
  // Show success message
  // Clear form
};
```

### Task 3: Create Password Setup Form Component (Google OAuth Users)

```yaml
CREATE src/components/Profile/PasswordSetupForm.tsx:
  - SIMILAR to PasswordChangeForm but without currentPassword field
  - USE same validation pattern but only newPassword + confirmPassword
  - ADD explanation text for Google OAuth users
  - USE same success/error handling patterns
```

### Task 4: Enhance Profile Page with Security Section

```yaml
MODIFY src/components/Profile/ProfileForm.tsx:
  - FIND existing Card component structure
  - ADD conditional security section after personal info
  - USE user.identities to determine Google vs email user
  - IMPORT PasswordChangeForm and PasswordSetupForm components
  - PRESERVE existing layout and styling patterns
```

**Pseudocode:**

```typescript
// Add after existing form in ProfileForm.tsx
const { user } = useSession();
const isGoogleUser = user?.identities?.some(identity => identity.provider === 'google');

return (
  <>
    {/* Existing profile form */}
    <Card className="max-w-2xl mx-auto mt-6">
      <CardHeader>
        <CardTitle>{t("profile:security")}</CardTitle>
        <CardDescription>
          {isGoogleUser
            ? t("profile:passwordSetupDescription")
            : t("profile:passwordChangeDescription")
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isGoogleUser ? <PasswordSetupForm /> : <PasswordChangeForm />}
      </CardContent>
    </Card>
  </>
);
```

### Task 5: Create Password Reset Confirmation Form

```yaml
CREATE src/components/Auth/ResetPasswordForm.tsx:
  - MIRROR form pattern from SignInForm.tsx
  - USE AuthPasswordInput component
  - IMPLEMENT newPassword + confirmPassword validation
  - USE same styling as existing auth forms
  - ADD form submission to updateUserPassword service
```

### Task 6: Enhance AuthCallbackPage for Password Reset

```yaml
MODIFY src/pages/AuthCallbackPage.tsx:
  - FIND existing auth event handling
  - ADD detection for PASSWORD_RECOVERY event type
  - RENDER ResetPasswordForm when password reset detected
  - PRESERVE existing OAuth and other callback handling
  - ADD redirect to profile page after successful password reset
```

**Pseudocode:**

```typescript
// In AuthCallbackPage.tsx
useEffect(() => {
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'PASSWORD_RECOVERY') {
      // Show password reset form
      setShowPasswordReset(true);
    }
    // ... existing logic
  });
}, []);

// Conditional rendering
if (showPasswordReset) {
  return <ResetPasswordForm onSuccess={() => navigate('/profile')} />;
}
```

### Task 7: Enhance SignInForm UX

```yaml
MODIFY src/components/Auth/SignInForm.tsx:
  - FIND existing resetPasswordForEmail implementation (lines 115-165)
  - ADD better success messaging
  - ADD rate limit error handling (2 emails/hour)
  - IMPROVE reset password mode toggle UX
  - PRESERVE existing functionality and styling
```

### Task 8: Add Translation Keys

```yaml
UPDATE public/locales/en/auth.json:
  - ADD currentPasswordRequired, passwordMismatch
  - ADD rateLimitExceeded message

UPDATE public/locales/zh-TW/auth.json:
  - ADD Chinese translations for new keys

UPDATE public/locales/en/profile.json:
  - ADD security, passwordSetupDescription, passwordChangeDescription

UPDATE public/locales/zh-TW/profile.json:
  - ADD Chinese translations for profile keys
```

### Integration Points

```yaml
ROUTING:
  - NO new routes needed - uses existing /auth and /profile routes
  - AuthCallbackPage handles password reset confirmation URLs

AUTHENTICATION:
  - Uses existing SessionContext for user state
  - Uses existing supabase client from @/integrations/supabase/client

DATABASE:
  - NO database changes needed - uses Supabase Auth tables
  - All operations via Supabase Auth API methods
```

## Validation Loop

### Level 1: Syntax & Style

```bash
# Run these FIRST - fix any errors before proceeding
npm run lint                         # ESLint check
npm run format                       # Prettier formatting

# Expected: No errors. If errors, fix them before proceeding.
```

### Level 2: UI Component Tests

```bash
# Test new profile password components
npm run test:ui -- components/Profile/PasswordChangeForm.test.tsx
npm run test:ui -- components/Profile/PasswordSetupForm.test.tsx
npm run test:ui -- components/Auth/ResetPasswordForm.test.tsx

# Test enhanced profile page
npm run test:ui -- pages/ProfilePage.test.tsx
npm run test:ui -- pages/AuthCallbackPage.test.tsx

# Expected: All tests pass. Create tests following patterns in tests/ui/
```

### Level 3: Manual Testing

```bash
# Test password change flow (email/password user)
npm run dev
# 1. Sign in with email/password
# 2. Go to /profile
# 3. Should see password change section
# 4. Test current password validation
# 5. Test new password validation
# 6. Test successful password change

# Test password setup flow (Google OAuth user)
# 1. Sign in with Google
# 2. Go to /profile
# 3. Should see password setup section
# 4. Test password setup form

# Test password reset flow
# 1. Go to /auth
# 2. Click "Forgot Password"
# 3. Enter email and submit (test rate limiting)
# 4. Check email and click reset link
# 5. Should show password reset form
# 6. Test password reset confirmation
```

## Final Validation Checklist

- [ ] All tests pass: `npm test`
- [ ] No linting errors: `npm run lint`
- [ ] Manual testing complete for all user flows
- [ ] Google OAuth users see password setup form in profile
- [ ] Email/password users see password change form in profile
- [ ] Password reset email flow works end-to-end
- [ ] Rate limiting handled gracefully (2 emails/hour)
- [ ] All forms follow React Hook Form + Zod patterns
- [ ] Internationalization complete (English/Chinese)
- [ ] Error handling comprehensive and user-friendly
- [ ] Security section only shows for authenticated users

---

## Anti-Patterns to Avoid

- ❌ Don't modify existing SignInForm password reset email functionality - enhance UX only
- ❌ Don't create new authentication patterns - use existing Supabase auth methods
- ❌ Don't hardcode strings - use translation keys for all user-facing text
- ❌ Don't ignore rate limiting - show user-friendly messages when limit hit
- ❌ Don't skip password validation - enforce minimum 8 characters + confirmation
- ❌ Don't show password options to Google OAuth users who haven't set one
- ❌ Don't create new form patterns - follow React Hook Form + Zod + shadcn consistently

---

**PRP Confidence Score: 9/10**

This PRP provides comprehensive context including existing code patterns, specific file locations, Supabase documentation URLs, translation requirements, and detailed implementation steps. The existing partial implementation in SignInForm.tsx provides a solid foundation, and the well-established patterns in the codebase (React Hook Form + Zod, shadcn/ui, service layers) make this a high-confidence one-pass implementation.
