# Library Tests

This directory contains tests for utility functions and services in `src/lib/`.

## Testing Utilities and Services

Test utility functions and service modules:

```tsx
import { myUtilityFunction } from "@/lib/utilities";
import * as myService from "@/lib/my-service";

describe("myUtilityFunction", () => {
  it("should process input correctly", () => {
    const result = myUtilityFunction("input");
    expect(result).toBe("expected output");
  });

  it("should handle edge cases", () => {
    expect(myUtilityFunction("")).toBe("");
    expect(myUtilityFunction(null)).toBe(null);
  });
});

describe("myService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call API correctly", async () => {
    const mockData = { id: "1", name: "test" };
    // Mock Supabase calls if needed

    const result = await myService.getData();
    expect(result).toEqual(mockData);
  });
});
```

## Common Library Test Patterns

- **Pure functions**: Test inputs and outputs, edge cases
- **Service functions**: Test API calls, error handling
- **Type utilities**: Test type guards and validators
- **Constants**: Test exported values and configurations

## Import Path

For services that use Supabase, use the mocked client from test-utils:

```tsx
import { render } from "../test-utils";
```
