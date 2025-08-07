name: "Fix OAuth Callback 404 Error on GitHub Pages Deployment - Complete Context for One-Pass Implementation"
description: |

## Purpose

Fix Google OAuth authentication callback 404 errors occurring on GitHub Pages production deployment by implementing proper auth callback route handling and resolving SPA routing issues. This PRP provides comprehensive context for resolving OAuth redirect failures in static hosting environments.

## Core Principles

1. **Context is King**: Complete documentation of GitHub Pages + Supabase + OAuth integration patterns
2. **Validation Loops**: Executable tests and deployment verification steps
3. **Information Dense**: Specific file paths, error patterns, and proven solutions
4. **Progressive Success**: Start with callback route, validate OAuth, then optimize deployment
5. **Global rules**: Follow all conventions in CLAUDE.md and existing auth patterns

---

## Goal

Resolve the 404 error that occurs when users complete Google OAuth authentication and are redirected to `/auth/callback` on the production GitHub Pages deployment (https://chabod.fruitful-tools.com/). Currently users see "404 page" instead of successful authentication.

## Why

- **Production Blocker**: Users cannot authenticate with Google OAuth on production site
- **User Experience**: Authentication failure creates poor onboarding experience
- **Business Impact**: Primary authentication method is completely broken in production
- **Security**: OAuth flow must complete properly for secure authentication

## What

Fix the authentication callback handling by implementing a proper `/auth/callback` route and resolving GitHub Pages SPA routing limitations. Users should complete OAuth flow and be properly authenticated without seeing 404 errors.

### Success Criteria

- [ ] Google OAuth authentication completes successfully on production GitHub Pages
- [ ] `/auth/callback` route exists and properly handles OAuth responses
- [ ] Users are redirected to appropriate page after successful authentication
- [ ] OAuth flow works with tenant invitations (preserves invite tokens)
- [ ] No 404 errors during authentication process
- [ ] Works on both development and production environments

## All Needed Context

### Documentation & References

```yaml
# MUST READ - Include these in your context window
- url: https://supabase.com/docs/guides/auth/social-login/auth-google
  why: Official Supabase Google OAuth implementation and callback handling
  section: Setting up OAuth providers and handling redirects

- url: https://supabase.com/docs/guides/auth/redirect-urls
  why: Critical information about OAuth redirect URL configuration
  critical: redirectTo parameter must match allowed redirect URLs exactly

- url: https://supabase.com/docs/reference/javascript/auth-signinwithoauth
  why: Complete API reference for signInWithOAuth parameters and options
  critical: redirectTo URL configuration and error handling patterns

- url: https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages#limitations
  why: Understanding GitHub Pages static hosting limitations with SPAs
  section: Client-side routing limitations and workarounds

- file: /Users/schwanndenkuo/Documents/personal/chabod/src/App.tsx
  why: Current routing configuration - missing /auth/callback route
  critical: Lines 46-66 show all defined routes, /auth/callback is missing

- file: /Users/schwanndenkuo/Documents/personal/chabod/src/components/Auth/GoogleOAuthButton.tsx
  why: OAuth initiation code - shows redirectTo configuration (lines 27-29)
  critical: Currently redirects to /auth/callback which doesn't exist as route

- file: /Users/schwanndenkuo/Documents/personal/chabod/public/404.html
  why: GitHub Pages SPA fallback mechanism already implemented
  critical: Lines 18-23 show redirect handling for SPA routing

- file: /Users/schwanndenkuo/Documents/personal/chabod/.github/workflows/pages.yml
  why: GitHub Pages deployment configuration and build process
  critical: Lines 36-38 show build command and BASE_PATH configuration

- file: /Users/schwanndenkuo/Documents/personal/chabod/PRPs/google-oauth-integration.md
  why: Existing OAuth integration patterns and component structure
  section: OAuth button implementation and tenant flow handling
```

### Current Issue Analysis

**Error Details from spec.md:**

- URL shows OAuth tokens correctly: `access_token=...&expires_at=...&refresh_token=...`
- Supabase callback URL: `https://cbqslwwonnlkvblpvyrc.supabase.co/auth/v1/callback`
- Production site: `https://chabod.fruitful-tools.com/`
- User redirected to 404 page at: `https://chabod.fruitful-tools.com/auth/callback#access_token=...`

**Root Causes Identified:**

1. **Missing Route**: `/auth/callback` route not defined in React Router (App.tsx:46-66)
2. **GitHub Pages Limitation**: Direct access to `/auth/callback` returns 404 from static server
3. **OAuth Token Handling**: No component to process OAuth response and establish session

### Current Codebase Auth Architecture

**Authentication Flow (src/components/Auth/):**

- `GoogleOAuthButton.tsx` - Initiates OAuth with redirectTo parameter
- `AuthContext.tsx` - Session management via SessionProvider
- `supabase/client.ts` - Supabase client configuration
- OAuth redirects to `/auth/callback` (line 28 in GoogleOAuthButton.tsx)

**GitHub Pages Deployment:**

- Uses BrowserRouter (not HashRouter) in App.tsx:120
- 404.html redirect mechanism implemented (lines 18-23)
- Build process: `vite build` outputs to `dist/` directory
- Deployment via `.github/workflows/pages.yml`

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: GitHub Pages serves static files only
// Direct access to /auth/callback returns 404 because no auth/callback.html exists
// Must use React Router to handle client-side routing

// GOTCHA: OAuth tokens appear in URL fragment (#access_token=...)
// Supabase auth automatically processes these on page load via onAuthStateChange
// But page must load successfully first (404 prevents processing)

// GOTCHA: Supabase redirectTo parameter is often ignored if URL not in allowlist
// Must add exact production URL to Supabase Dashboard > Authentication > URL Configuration

// PATTERN: Existing 404.html handles SPA routing redirects
// sessionStorage.setItem('redirectPath', location.pathname + location.search + location.hash);
// App.tsx lines 36-42 handle redirect after page loads

// PATTERN: OAuth success triggers onAuthStateChange in AuthContext
// No manual session handling needed - SessionProvider handles automatically
```

## Implementation Blueprint

### Missing Components to Create

```bash
src/pages/
├── AuthCallbackPage.tsx          # New OAuth callback handler page
└── (existing auth pages)         # No changes needed
```

### Modified Components

```bash
src/
├── App.tsx                       # Add /auth/callback route
└── components/Auth/GoogleOAuthButton.tsx  # Potentially update redirectTo URL
```

### List of Tasks to Complete (In Order)

```yaml
Task 1 - Create OAuth Callback Handler Page:
CREATE src/pages/AuthCallbackPage.tsx:
  - MIRROR pattern from: src/pages/AuthPage.tsx structure
  - HANDLE OAuth callback processing automatically via Supabase
  - REDIRECT users after successful authentication
  - PRESERVE invite token handling for tenant flows
  - SHOW loading state while processing OAuth tokens
  - HANDLE error cases (failed authentication, invalid tokens)

Task 2 - Add Auth Callback Route:
MODIFY src/App.tsx:
  - FIND Routes section (lines 46-66)
  - ADD route: <Route path="/auth/callback" element={<AuthCallbackPage />} />
  - PLACE route after existing auth routes for consistency
  - PRESERVE all existing routing functionality

Task 3 - Verify OAuth Button Redirect Configuration:
REVIEW src/components/Auth/GoogleOAuthButton.tsx:
  - VERIFY redirectTo URL is correct for production (line 28-29)
  - ENSURE both development and production URLs are handled
  - CONFIRM invite token preservation logic is working

Task 4 - Test GitHub Pages Deployment Build:
VERIFY build process includes new files:
  - RUN npm run build locally to test
  - CONFIRM dist/ includes AuthCallbackPage assets
  - CHECK that 404.html redirect mechanism works with new route

Task 5 - Configure Supabase Redirect URLs:
UPDATE Supabase Dashboard settings:
  - ADD https://chabod.fruitful-tools.com/auth/callback to redirect URLs
  - ADD http://localhost:8080/auth/callback for development
  - VERIFY Google Cloud Console OAuth settings match

Task 6 - Add Comprehensive Tests:
CREATE tests/ui/pages/AuthCallbackPage.test.tsx:
  - TEST OAuth token processing scenarios
  - TEST redirect behavior after successful auth
  - TEST error handling for failed authentication
  - TEST tenant invite token preservation
  - USE existing auth test patterns from AuthPage.test.tsx

Task 7 - Integration Testing:
VERIFY complete OAuth flow:
  - TEST development environment (localhost:8080)
  - TEST production GitHub Pages deployment
  - TEST tenant invitation flows with OAuth
  - TEST error scenarios and edge cases
```

### Implementation Pseudocode

```typescript
// Task 1: AuthCallbackPage Component
export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { session } = useSession();

  useEffect(() => {
    // PATTERN: Supabase automatically processes OAuth tokens from URL fragments
    // onAuthStateChange in SessionProvider will detect successful authentication

    // GOTCHA: Need to handle both success and error cases
    const handleOAuthCallback = async () => {
      try {
        // CRITICAL: Check for error parameters in URL
        const urlParams = new URLSearchParams(window.location.search);
        const error = urlParams.get('error');

        if (error) {
          throw new Error(error);
        }

        // PATTERN: Wait for session to be established
        // SessionProvider handles onAuthStateChange automatically

        // CRITICAL: Handle redirect after auth success
        // Check for invite tokens, redirect to appropriate page
        const inviteToken = urlParams.get('inviteToken');
        if (inviteToken) {
          // Handle tenant invitation flow
          navigate(`/tenant/auth?invite=${inviteToken}`);
        } else {
          // Redirect to dashboard or original destination
          const redirectPath = sessionStorage.getItem('redirectPath') || '/dashboard';
          sessionStorage.removeItem('redirectPath');
          navigate(redirectPath, { replace: true });
        }
      } catch (error) {
        setError(error.message);
        setIsLoading(false);
      }
    };

    // PATTERN: Wait brief moment for auth state to update
    const timeout = setTimeout(handleOAuthCallback, 1000);
    return () => clearTimeout(timeout);
  }, [navigate]);

  // Update loading state when session changes
  useEffect(() => {
    if (session) {
      setIsLoading(false);
    }
  }, [session]);

  // PATTERN: Show loading UI while processing
  if (isLoading) {
    return <div>Completing authentication...</div>;
  }

  // PATTERN: Show error UI if authentication failed
  if (error) {
    return <div>Authentication failed: {error}</div>;
  }

  return null; // Should redirect before rendering
}

// Task 2: App.tsx Route Addition
// Add this route to the Routes component:
<Route path="/auth/callback" element={<AuthCallbackPage />} />
```

### Integration Points

```yaml
SUPABASE_DASHBOARD:
  - location: https://supabase.com/dashboard/project/[PROJECT_ID]/auth/url-configuration
  - action: Add https://chabod.fruitful-tools.com/auth/callback to redirect URLs
  - action: Add http://localhost:8080/auth/callback for development
  - verify: Google provider is enabled and configured

GOOGLE_CLOUD_CONSOLE:
  - location: Google Cloud Console > APIs & Services > Credentials
  - verify: OAuth client has correct redirect URIs
  - verify: Authorized domains include chabod.fruitful-tools.com

GITHUB_PAGES:
  - file: .github/workflows/pages.yml
  - verify: Build process includes new AuthCallbackPage
  - verify: 404.html redirect mechanism handles /auth/callback

SESSION_MANAGEMENT:
  - file: src/contexts/AuthContext.tsx
  - pattern: onAuthStateChange automatically handles OAuth success
  - pattern: SessionProvider fetches user profile after authentication
  - no changes needed: Existing session management works with OAuth
```

## Validation Loop

### Level 1: Syntax & Style

```bash
# Run these FIRST - fix any errors before proceeding
npm run lint -- src/pages/AuthCallbackPage.tsx --fix
npm run lint -- src/App.tsx --fix
npm run format

# Expected: No errors. If errors, READ the error and fix.
```

### Level 2: Unit Tests

```bash
# Test new callback page component
npm run test:ui -- AuthCallbackPage.test.tsx

# Test routing changes don't break existing functionality
npm run test:ui -- App.test.tsx
npm run test:ui -- AuthPage.test.tsx

# If failing: Read error, understand root cause, fix code, re-run
# NEVER mock to pass - fix actual implementation
```

### Level 3: Development Integration Testing

```bash
# Start development server
npm run dev

# Manual OAuth flow test:
# 1. Navigate to http://localhost:8080/auth
# 2. Click "Continue with Google" button
# 3. Complete Google OAuth in popup/redirect
# 4. Verify successful redirect to /auth/callback
# 5. Verify final redirect to dashboard or appropriate page
# 6. Check browser dev tools for any errors

# Test tenant invitation flow:
# 1. Get tenant invite URL from existing tenant
# 2. Open invite URL in incognito window
# 3. Click "Continue with Google" on tenant auth page
# 4. Verify OAuth callback preserves invite token
# 5. Verify user added to tenant with correct role
```

### Level 4: Production Deployment Testing

```bash
# Build and verify production assets
npm run build

# Check that AuthCallbackPage is included in build
ls -la dist/assets/AuthCallbackPage*

# Deploy to GitHub Pages (via workflow or manual)
# Manual test OAuth flow on production:
# 1. Navigate to https://chabod.fruitful-tools.com/auth
# 2. Click "Continue with Google" button
# 3. Complete Google OAuth
# 4. Verify no 404 error occurs
# 5. Verify successful authentication and redirect

# Test direct URL access (GitHub Pages specific):
# 1. Navigate directly to https://chabod.fruitful-tools.com/auth/callback
# 2. Should redirect to home via 404.html mechanism
# 3. Should not show permanent 404 error
```

### Level 5: Full Test Suite

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
- [ ] `/auth/callback` route exists and renders AuthCallbackPage
- [ ] OAuth flow completes successfully on localhost:8080
- [ ] OAuth flow completes successfully on production GitHub Pages
- [ ] No 404 errors during authentication process
- [ ] Tenant invitation flow works with OAuth (invite tokens preserved)
- [ ] Error cases handled gracefully (failed auth, network errors)
- [ ] Supabase redirect URLs configured for both environments
- [ ] Google Cloud Console OAuth settings verified

---

## Anti-Patterns to Avoid

- ❌ Don't try to manually handle OAuth tokens - Supabase does this automatically
- ❌ Don't switch to HashRouter without considering OAuth implications (some providers don't support # in redirect URLs)
- ❌ Don't ignore error cases - OAuth can fail for many reasons
- ❌ Don't forget to configure both development and production redirect URLs
- ❌ Don't skip manual testing on actual GitHub Pages deployment
- ❌ Don't remove the existing 404.html redirect mechanism - it's needed for SPA routing
- ❌ Don't modify the GoogleOAuthButton redirectTo logic without understanding tenant flows
- ❌ Don't assume authentication worked - always handle loading and error states

## Expected Implementation Confidence Score: 9.5/10

**Reasoning:**

- ✅ Root cause clearly identified: missing /auth/callback route + GitHub Pages SPA limitations
- ✅ Complete context provided with specific file paths and line numbers
- ✅ External research confirms common issue with established solutions
- ✅ Existing OAuth infrastructure is solid - just missing callback handler
- ✅ GitHub Pages 404.html redirect mechanism already implemented
- ✅ Supabase authentication architecture is well-designed and functional
- ✅ Testing strategy covers both development and production environments
- ✅ Implementation is straightforward: add one page component and one route
- ✅ Comprehensive validation loops ensure successful deployment

**Minor Risk Factors:**

- OAuth URL configuration requires manual setup in external services
- GitHub Pages deployment timing could affect testing workflow

**Mitigation:**

- Detailed configuration steps provided for Supabase and Google Cloud Console
- Progressive testing strategy validates each step before proceeding
- Existing 404.html redirect mechanism provides fallback for SPA routing issues
