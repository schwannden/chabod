# Hook Tests

This directory contains tests for custom React hooks in `src/hooks/`.

## Testing Custom Hooks

Use `@testing-library/react-hooks` patterns for testing hooks:

```tsx
import { renderHook, act } from "@testing-library/react";
import { useCustomHook } from "@/hooks/useCustomHook";

describe("useCustomHook", () => {
  it("should return initial state", () => {
    const { result } = renderHook(() => useCustomHook());

    expect(result.current.value).toBe(initialValue);
  });

  it("should update state when action is called", () => {
    const { result } = renderHook(() => useCustomHook());

    act(() => {
      result.current.updateValue("new value");
    });

    expect(result.current.value).toBe("new value");
  });
});
```

## Common Hook Test Patterns

- **State management hooks**: Test initial state and state updates
- **API hooks**: Test loading, success, and error states
- **Effect hooks**: Test side effects and cleanup
- **Authentication hooks**: Test session management and permissions

## Import Path

```tsx
import { render } from "../test-utils";
```
