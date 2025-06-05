# Component Tests

This directory contains tests for UI components organized by feature/domain.

## Directory Structure

Each subdirectory corresponds to a feature area in `src/components/`:

- `Auth/` - Authentication components (login, signup, password reset)
- `Events/` - Event management components
- `Groups/` - Group management components
- `Landing/` - Landing page components
- `Layout/` - Layout components (headers, navigation, footers)
- `Members/` - Member management components
- `Profile/` - User profile components
- `Resources/` - Resource management components
- `Services/` - Service management components
- `ServiceEvents/` - Service event specific components
- `Tenants/` - Tenant/church management components
- `shared/` - Reusable components used across features

## Testing Guidelines

- **Test user behavior**: Focus on what users see and do, not implementation details
- **Use semantic queries**: Prefer `getByRole`, `getByLabelText`, `getByText` over `getByTestId`
- **Test error states**: Always include tests for error conditions
- **Test loading states**: Verify loading indicators and async behavior
- **Test accessibility**: Ensure components are accessible with proper ARIA labels

## Naming Conventions

- Component test files: `ComponentName.test.tsx`
- Hook test files: `useHookName.test.tsx`
- Utility test files: `utilityName.test.ts`

## Example Test Structure

```tsx
describe("ComponentName", () => {
  describe("Rendering", () => {
    it("should render correctly with required props", () => {
      // Test basic rendering
    });

    it("should handle optional props", () => {
      // Test optional behavior
    });
  });

  describe("User Interactions", () => {
    it("should handle button clicks", async () => {
      // Test user interactions
    });
  });

  describe("Error Handling", () => {
    it("should display error messages", () => {
      // Test error states
    });
  });
});
```

## Integration with Test Utils

All component tests should use the shared `test-utils.tsx` from the parent directory:

```tsx
import { render } from "../../test-utils";
```

This provides consistent setup including:

- i18n mocking
- Router mocking
- Supabase mocking
- Session mocking
