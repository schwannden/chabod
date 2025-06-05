# Page Tests

This directory contains tests for page-level components that correspond to routes in the application.

## Directory Structure

Each test file corresponds to a page component in `src/pages/`:

- `DashboardPage.test.tsx` - Main dashboard functionality
- `LoginPage.test.tsx` - Authentication login page
- `TenantPage.test.tsx` - Tenant-specific dashboard pages
- Additional page tests as the application grows

## Testing Focus

Page tests should focus on:

- **Integration behavior**: How multiple components work together
- **Route handling**: Navigation and URL parameter handling
- **Authentication flows**: Login/logout behavior and protected routes
- **Data loading**: Initial page data fetching and error handling
- **User workflows**: Complete user journeys through the page

## Testing Patterns

### Authentication Testing

```tsx
it("should redirect to auth when user is not logged in", () => {
  mockUseSession.mockReturnValue({
    session: null,
    user: null,
    profile: null,
    isLoading: false,
    signOut: jest.fn(),
  });

  render(<PageComponent />);

  expect(mockNavigate).toHaveBeenCalledWith("/auth");
});
```

### Loading State Testing

```tsx
it("should show loading state while fetching data", () => {
  mockDataService.mockImplementation(() => new Promise(() => {}));

  render(<PageComponent />);

  expect(screen.getByText("Loading...")).toBeInTheDocument();
});
```

### Error Handling Testing

```tsx
it("should handle data fetching errors gracefully", async () => {
  mockDataService.mockRejectedValue(new Error("Fetch failed"));

  await act(async () => {
    render(<PageComponent />);
  });

  await waitFor(() => {
    expect(screen.getByText("Error message")).toBeInTheDocument();
  });
});
```

## Common Setup Patterns

Most page tests will need:

```tsx
beforeEach(() => {
  jest.clearAllMocks();

  // Setup authentication
  mockUseSession.mockReturnValue({
    session: mockSession,
    user: mockUser,
    profile: mockProfile,
    isLoading: false,
    signOut: jest.fn(),
  });

  // Setup data services
  mockDataService.mockResolvedValue(mockData);
});
```

## Integration with Test Utils

Use the shared test utilities:

```tsx
import { render } from "../test-utils";
```

This provides consistent mocking for page-level concerns like routing and authentication.
