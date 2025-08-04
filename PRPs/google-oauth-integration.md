name: "Google OAuth Integration PRP - Complete Context for One-Pass Implementation"
description: |

## Purpose

Integrate Google OAuth login alongside existing email/password authentication in a multi-tenant church management system. This PRP provides comprehensive context for implementing Google OAuth with account linking by email to avoid duplicate user profiles.

## Core Principles

1. **Context is King**: Complete codebase patterns, Supabase OAuth docs, and testing strategies included
2. **Validation Loops**: Executable tests and lints provided for iterative refinement
3. **Information Dense**: Specific file paths, code snippets, and integration points
4. **Progressive Success**: Start with basic OAuth, validate, then integrate with tenant flows
5. **Global rules**: Follow all conventions in CLAUDE.md and existing auth patterns

---

## Goal

Add Google OAuth sign-in capability to all existing authentication flows in the multi-tenant church management system, ensuring accounts are linked by email to prevent duplicate profiles and maintaining all existing tenant association logic.

## Why

- **Business value**: Simplified user onboarding and reduced friction for new users
- **User experience**: Modern authentication expectations for SaaS applications
- **Integration**: Seamlessly works with existing tenant invitation and membership flows
- **Security**: Leverages Google's robust authentication infrastructure

## What

Add Google OAuth buttons to existing authentication forms with automatic account linking by email. Users can sign in with Google across all auth scenarios: global auth, tenant-specific auth (new user, existing user, member sign-in).

### Success Criteria

- [ ] Google OAuth buttons present in all 6 auth forms (SignIn, SignUp, JoinTenant forms)
- [ ] Same email addresses link to single user profile (no duplicates created)
- [ ] All tenant association logic preserved and working with OAuth users
- [ ] OAuth users can complete tenant invitation flows successfully
- [ ] All existing tests pass and new OAuth scenarios covered
- [ ] No breaking changes to existing email/password flows

## All Needed Context

### Documentation & References

```yaml
# MUST READ - Include these in your context window
- url: https://supabase.com/docs/guides/auth/social-login/auth-google
  why: Official Supabase Google OAuth implementation guide
  section: Pre-built OAuth configuration and React examples

- url: https://supabase.com/docs/reference/javascript/auth-signinwithoauth
  why: Complete API reference for signInWithOAuth method parameters
  critical: redirectTo URLs, provider options, error handling patterns

- url: https://supabase.com/docs/guides/auth/auth-identity-linking
  why: Automatic account linking by email to prevent duplicate profiles
  critical: Email-based identity linking is automatic in Supabase

- file: /Users/schwanndenkuo/Documents/personal/chabod/src/components/Auth/SignInForm.tsx
  why: Current email/password form pattern to replicate for OAuth

- file: /Users/schwanndenkuo/Documents/personal/chabod/src/components/Auth/SignUpForm.tsx
  why: Form structure and onSuccess callback patterns to maintain

- file: /Users/schwanndenkuo/Documents/personal/chabod/src/hooks/useTenantAuthFlow.ts
  why: Complex tenant auth flow logic that must work with OAuth

- file: /Users/schwanndenkuo/Documents/personal/chabod/src/lib/membership-service.ts
  why: associateUserWithTenant() function to use after OAuth success

- file: /Users/schwanndenkuo/Documents/personal/chabod/tests/ui/components/Auth/SignUpForm.test.tsx
  why: Testing patterns for auth components including mocking and error handling

- file: /Users/schwanndenkuo/Documents/personal/chabod/tests/ui/test-utils.tsx
  why: mockUseSessionHelpers for testing authenticated states
```

### Current Codebase Auth Architecture

**Authentication Components (src/components/Auth/):**

- `AuthTabs.tsx` - Tab switcher between sign-in/sign-up (global)
- `SignInForm.tsx` - Global sign-in form (ADD GOOGLE BUTTON)
- `SignUpForm.tsx` - Global sign-up form (ADD GOOGLE BUTTON)
- `TenantAuthFlow.tsx` - Multi-step tenant auth coordinator
- `JoinTenantSignInForm.tsx` - Existing user joining tenant (ADD GOOGLE BUTTON)
- `JoinTenantSignUpForm.tsx` - New user for tenant (ADD GOOGLE BUTTON)
- `MemberSignInForm.tsx` - Existing member sign-in (ADD GOOGLE BUTTON)
- `EmailDetectionForm.tsx` - Check if email exists (SKIP FOR OAUTH)

**Key Auth Patterns:**

```typescript
// Current Success Handler Pattern (to maintain)
interface AuthFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

// Current Supabase Auth Usage
const { data, error } = await supabase.auth.signInWithPassword({
  email: trimmedEmail,
  password,
});

// Tenant Association After Auth (to use with OAuth)
await associateUserWithTenant(user.id, tenantId, inviteRole);
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: Supabase automatically links accounts by email
// No manual linking needed - existing profiles preserved

// GOTCHA: OAuth redirects require exact URL matching
// redirectTo MUST match Google Console and Supabase dashboard config

// GOTCHA: signInWithOAuth triggers redirect immediately
// Handle loading states and prevent multiple calls

// PATTERN: All forms use toast notifications for errors
import { toast } from "@/hooks/use-toast";

// PATTERN: All forms disable submit during loading
const [isLoading, setIsLoading] = useState(false);

// PATTERN: Profile fetching is automatic via SessionProvider
// No manual profile creation needed after OAuth success
```

## Implementation Blueprint

### New Components to Create

```bash
src/components/Auth/
├── GoogleOAuthButton.tsx          # Reusable OAuth button component
└── OAuthDivider.tsx              # "or" divider for forms
```

### Modified Components

```bash
src/components/Auth/
├── SignInForm.tsx                # Add Google button
├── SignUpForm.tsx                # Add Google button
├── JoinTenantSignInForm.tsx      # Add Google button
├── JoinTenantSignUpForm.tsx      # Add Google button
└── MemberSignInForm.tsx          # Add Google button
```

### Updated Tests

```bash
tests/ui/components/Auth/
├── GoogleOAuthButton.test.tsx    # New component tests
├── SignInForm.test.tsx           # Add OAuth scenarios
├── SignUpForm.test.tsx           # Add OAuth scenarios
├── JoinTenantSignInForm.test.tsx # Add OAuth scenarios
├── JoinTenantSignUpForm.test.tsx # Add OAuth scenarios
└── MemberSignInForm.test.tsx     # Add OAuth scenarios
```

### List of Tasks to Complete (In Order)

```yaml
Task 1 - Create Reusable Google OAuth Button:
CREATE src/components/Auth/GoogleOAuthButton.tsx:
  - MIRROR pattern from: SignInForm.tsx button structure
  - USE signInWithOAuth method from Supabase client
  - HANDLE loading states with disabled button
  - ACCEPT onSuccess/onError props like existing forms
  - INCLUDE Google logo icon and proper styling
  - HANDLE redirectTo URL properly for callbacks

Task 2 - Create OAuth Divider Component:
CREATE src/components/Auth/OAuthDivider.tsx:
  - Simple "or continue with" divider line
  - MATCH existing form styling patterns
  - SUPPORT i18n with translation keys

Task 3 - Modify Global Sign-In Form:
MODIFY src/components/Auth/SignInForm.tsx:
  - FIND the form submit button
  - ADD GoogleOAuthButton above the existing form
  - ADD OAuthDivider between OAuth and form
  - PRESERVE all existing functionality
  - MAINTAIN existing onSuccess callback pattern

Task 4 - Modify Global Sign-Up Form:
MODIFY src/components/Auth/SignUpForm.tsx:
  - FIND the form submit button
  - ADD GoogleOAuthButton above the existing form
  - ADD OAuthDivider between OAuth and form
  - PRESERVE all existing functionality
  - MAINTAIN existing onSuccess callback pattern

Task 5 - Modify Tenant Join Sign-In Form:
MODIFY src/components/Auth/JoinTenantSignInForm.tsx:
  - FIND the form submit button
  - ADD GoogleOAuthButton above the existing form
  - ENSURE OAuth uses same tenant association logic
  - TEST that invite tokens are preserved after OAuth redirect

Task 6 - Modify Tenant Join Sign-Up Form:
MODIFY src/components/Auth/JoinTenantSignUpForm.tsx:
  - FIND the form submit button
  - ADD GoogleOAuthButton above the existing form
  - ENSURE OAuth uses same tenant association logic
  - TEST that invite tokens are preserved after OAuth redirect

Task 7 - Modify Member Sign-In Form:
MODIFY src/components/Auth/MemberSignInForm.tsx:
  - FIND the form submit button
  - ADD GoogleOAuthButton above the existing form
  - PRESERVE existing member verification logic

Task 8 - Add Translation Keys:
MODIFY public/locales/en/auth.json:
  - ADD: "continueWithGoogle": "Continue with Google"
  - ADD: "orContinueWith": "or continue with"
  - ADD: "signingInWithGoogle": "Signing in with Google..."

MODIFY public/locales/zh-TW/auth.json:
  - ADD: "continueWithGoogle": "使用 Google 繼續"
  - ADD: "orContinueWith": "或繼續使用"
  - ADD: "signingInWithGoogle": "正在使用 Google 登入..."

Task 9 - Create OAuth Button Tests:
CREATE tests/ui/components/Auth/GoogleOAuthButton.test.tsx:
  - TEST OAuth initiation on click
  - TEST loading states during OAuth
  - TEST error handling for OAuth failures
  - MOCK signInWithOAuth method properly
  - USE existing auth test patterns from SignUpForm.test.tsx

Task 10 - Update Existing Form Tests:
MODIFY each form test file:
  - ADD test scenarios for OAuth button presence
  - ADD test scenarios for OAuth success/error flows
  - ENSURE existing form functionality tests still pass
  - USE mockUseSessionHelpers from test-utils.tsx

Task 11 - Integration Testing:
RUN existing auth tests and ensure:
  - All existing email/password flows still work
  - New OAuth buttons render correctly
  - No regression in tenant association logic
  - RLS tests continue to pass (auth method doesn't affect RLS)
```

### Implementation Pseudocode

```typescript
// Task 1: GoogleOAuthButton Component
interface GoogleOAuthButtonProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  inviteToken?: string; // For tenant invitations
}

export function GoogleOAuthButton({ onSuccess, onError, inviteToken }: GoogleOAuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation("auth");

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      // CRITICAL: Include invite token in redirect URL for tenant flows
      const redirectTo = inviteToken
        ? `${window.location.origin}/auth/callback?inviteToken=${inviteToken}`
        : `${window.location.origin}/auth/callback`;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          // CRITICAL: Don't need scopes - default includes email and profile
        }
      });

      if (error) throw error;

      // Success handled by redirect - onSuccess called in callback
    } catch (error) {
      setIsLoading(false);
      onError?.(error.message);
      toast({
        title: t("auth:signInError"),
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleGoogleSignIn}
      disabled={isLoading}
      className="w-full"
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <GoogleIcon className="mr-2 h-4 w-4" />
      )}
      {isLoading ? t("signingInWithGoogle") : t("continueWithGoogle")}
    </Button>
  );
}

// Task 3-7: Form Integration Pattern
export function SignInForm({ onSuccess }: AuthFormProps) {
  // ... existing code ...

  return (
    <div className="space-y-4">
      {/* NEW: Add OAuth button at top */}
      <GoogleOAuthButton
        onSuccess={onSuccess}
        onError={(error) => setError(error)}
      />

      {/* NEW: Add divider */}
      <OAuthDivider />

      {/* EXISTING: Keep all existing form code */}
      <Form>
        {/* ... existing form fields and submit button ... */}
      </Form>
    </div>
  );
}
```

### Integration Points

```yaml
SUPABASE_CONFIGURATION:
  - Google OAuth already configured in Supabase dashboard
  - Callback URL: https://cbqslwwonnlkvblpvyrc.supabase.co/auth/v1/callback
  - Client ID and secret already set up

GOOGLE_CONSOLE:
  - OAuth client already configured
  - Authorized domains: localhost:8080, chabod.fruitful-tools.com
  - Redirect URLs already include auth/v1/callback

TENANT_ASSOCIATION:
  - Use existing associateUserWithTenant() from membership-service.ts
  - OAuth users follow same tenant membership logic
  - Invite tokens preserved through OAuth redirect

PROFILE_MANAGEMENT:
  - Profiles auto-created via database triggers (no changes needed)
  - SessionProvider automatically fetches profiles (no changes needed)
  - User metadata from Google stored in auth.users.raw_user_meta_data
```

## Validation Loop

### Level 1: Syntax & Style

```bash
# Run these FIRST - fix any errors before proceeding
npm run lint -- src/components/Auth/GoogleOAuthButton.tsx --fix
npm run lint -- src/components/Auth/OAuthDivider.tsx --fix
npm run format

# Expected: No errors. If errors, READ the error and fix.
```

### Level 2: Unit Tests

```bash
# Test OAuth button component
npm run test:ui -- GoogleOAuthButton.test.tsx

# Test modified forms still work
npm run test:ui -- SignInForm.test.tsx
npm run test:ui -- SignUpForm.test.tsx

# Test tenant-specific forms
npm run test:ui -- JoinTenantSignInForm.test.tsx
npm run test:ui -- JoinTenantSignUpForm.test.tsx
npm run test:ui -- MemberSignInForm.test.tsx

# If failing: Read error, understand root cause, fix code, re-run
# NEVER mock to pass - fix actual implementation
```

### Level 3: Integration Testing

```bash
# Start development server
npm run dev

# Manual test OAuth flow:
# 1. Navigate to http://localhost:8080/auth
# 2. Click "Continue with Google" button
# 3. Complete Google OAuth in popup/redirect
# 4. Verify successful auth and profile creation
# 5. Test tenant invitation flow with OAuth

# Test tenant-specific OAuth:
# 1. Get tenant invite URL (from existing tenant)
# 2. Open invite URL in incognito window
# 3. Click "Continue with Google" on tenant auth page
# 4. Verify user added to tenant with correct role
```

### Level 4: Full Test Suite

```bash
# Run all UI tests to ensure no regressions
npm run test:ui

# Run RLS tests (auth method shouldn't affect these)
npm run test:rls

# Expected: All tests pass
# If failing: OAuth implementation broke existing functionality - fix it
```

## Final Validation Checklist

- [ ] All tests pass: `npm run test`
- [ ] No linting errors: `npm run lint`
- [ ] No type errors: TypeScript compiler clean
- [ ] Google OAuth works in all 5 auth scenarios
- [ ] Account linking by email prevents duplicates
- [ ] Tenant invitation flow works with OAuth
- [ ] Existing email/password auth unchanged
- [ ] Translation keys added for both languages
- [ ] Manual testing successful on localhost

---

## Anti-Patterns to Avoid

- ❌ Don't create new auth patterns - follow existing form structure exactly
- ❌ Don't skip testing - OAuth introduces async complexity that needs validation
- ❌ Don't ignore redirect URL configuration - exact matches required
- ❌ Don't manually link accounts - Supabase does this automatically by email
- ❌ Don't modify tenant association logic - reuse existing associateUserWithTenant()
- ❌ Don't forget translation keys - app is internationalized
- ❌ Don't break existing forms - OAuth should be additive only

## Expected Implementation Confidence Score: 8.5/10

**Reasoning:**

- ✅ Complete context provided with specific file paths and code patterns
- ✅ Existing auth architecture thoroughly analyzed and documented
- ✅ Supabase OAuth documentation and account linking behavior understood
- ✅ Testing patterns clearly established with existing examples
- ✅ Implementation tasks broken down into specific, actionable steps
- ✅ All integration points identified (tenant flows, translations, etc.)
- ✅ Validation gates provide clear success/failure criteria
- ✅ Anti-patterns help avoid common OAuth pitfalls

**Minor Risk Factors:**

- OAuth redirect handling can be tricky with invite tokens
- Tenant association timing after OAuth redirect needs careful testing
- Google OAuth configuration already done but needs validation

**Mitigation:**

- Comprehensive testing strategy covers integration scenarios
- Progressive implementation allows validation at each step
- Existing patterns provide proven foundation to build upon
