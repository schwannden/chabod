# Page Component Tests

This directory contains tests for page-level components that represent full application screens.

## Overview

Page tests focus on complete user workflows, navigation behavior, and integration between multiple components. These tests ensure that entire pages work correctly from a user's perspective.

## Test Files

### Authentication Pages

#### `AuthPage.test.tsx` - Main Authentication Page

Tests for the main authentication page (`src/pages/AuthPage.tsx`) that handles login/signup for the multi-tenant system.

**Key Test Areas:**

- **Authentication State Management**: Loading states, redirects for authenticated users
- **Auth Form Display**: Welcome message, form rendering, tab parameter handling
- **Authentication Success**: Navigation to dashboard after successful auth
- **Layout and UI Elements**: NavBar rendering, proper styling, main content structure
- **Edge Cases**: Rapid state changes, missing user handling, session data validation
- **URL Parameter Handling**: Tab parameter parsing, empty params, multiple parameters

**Coverage:**

- Session loading and authentication state transitions
- URL parameter parsing for initial tab selection (`?tab=signup`)
- Navigation behavior based on authentication status
- Error handling and edge cases
- UI component integration

#### `TenantAuthPage.test.tsx` - Tenant-Specific Authentication Page

Tests for the tenant-specific authentication page (`src/pages/tenant/AuthPage.tsx`) that handles authentication for individual tenants.

**Key Test Areas:**

- **Tenant Loading**: Fetching tenant data, loading states, error handling
- **Invitation Token Handling**: URL token extraction, invitation flow
- **User Authentication and Access**: Member access checks, redirect logic
- **Auth Form Display**: Tenant-specific branding, form props
- **Authentication Success**: Navigation to tenant dashboard
- **Error Page Display**: Tenant not found, navigation back to home
- **Loading States**: Session and tenant loading indicators
- **Edge Cases**: Missing slug, rapid state changes, authentication errors

**Coverage:**

- Tenant data fetching and validation
- Invitation token processing from URL parameters
- Member access verification using `checkUserTenantAccess`
- Tenant-specific UI rendering with tenant name and branding
- Error states for non-existent tenants
- Complex authentication flows with invitation handling

### Dashboard Pages

#### `DashboardPage.test.tsx` - Main Dashboard

Tests for the main dashboard page that displays tenant management interface.

**Coverage:**

- Tenant list display and management
- Authentication state handling
- Tenant creation, update, and deletion workflows
- Loading states and error handling
- Empty states and user interactions

## Testing Patterns

### Authentication Testing

```tsx
// Mock session state
mockUseSession.mockReturnValue({
  session: null,
  user: mockUser,
  profile: null,
  isLoading: false,
  signOut: jest.fn(),
});

// Test authentication redirects
expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
```

### URL Parameter Testing

```tsx
// Mock URL parameters
mockUseSearchParams.mockReturnValue([new URLSearchParams("tab=signup")]);

// Test parameter handling
expect(screen.getByTestId("initial-tab")).toHaveTextContent("signup");
```

### Async State Testing

```tsx
// Test loading states
await act(async () => {
  render(<AuthPage />);
});

await waitFor(() => {
  expect(screen.getByText("Expected Content")).toBeInTheDocument();
});
```

### Service Function Mocking

```tsx
// Mock service functions
(tenantUtils.getTenantBySlug as jest.Mock).mockResolvedValue(mockTenant);
(memberService.checkUserTenantAccess as jest.Mock).mockResolvedValue(true);
```

## Integration with Test Utils

All page tests use the shared test utilities from `../test-utils.tsx` which provide:

- Consistent mocking for routing and authentication
- Mock data factories for common entities
- Proper React Query and context provider setup
- Standardized rendering with all necessary providers

## Mock Setup

Page tests rely on global mocks defined in `tests/ui-setup.ts`:

- **React Router**: Navigation and parameter hooks
- **Authentication**: `useSession` hook with configurable return values
- **Services**: Tenant utilities, member services, and other API functions
- **UI Components**: Icons, dialogs, and shared components
- **Internationalization**: Translation functions

## Best Practices

1. **Test User Behavior**: Focus on what users see and do, not implementation details
2. **Use Semantic Queries**: Prefer `getByRole`, `getByText`, `getByLabelText`
3. **Handle Async Operations**: Use `act()` and `waitFor()` for state updates
4. **Mock External Dependencies**: Service functions, navigation, authentication
5. **Test Error States**: Network failures, missing data, invalid states
6. **Test Loading States**: Ensure proper loading indicators and transitions
7. **Test Edge Cases**: Missing parameters, rapid state changes, error conditions

## Running Page Tests

```bash
# Run all page tests
npm run test:ui -- --testPathPattern="pages"

# Run specific page tests
npm run test:ui -- --testPathPattern="AuthPage"
npm run test:ui -- --testPathPattern="DashboardPage"

# Run with verbose output
npm run test:ui -- --testPathPattern="pages" --verbose
```

## Coverage Goals

Page tests should cover:

- ✅ Authentication flows and state management
- ✅ Navigation behavior and routing
- ✅ Data fetching and loading states
- ✅ Error handling and edge cases
- ✅ User interactions and form submissions
- ✅ URL parameter handling
- ✅ Integration between components
- ✅ Responsive behavior and accessibility

The page tests complement component tests by focusing on complete user workflows and ensuring that all pieces work together correctly in real usage scenarios.
