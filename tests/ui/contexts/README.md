# Context Tests

This directory contains tests for React context providers in `src/contexts/`.

## Testing Context Providers

Test context providers by rendering them with test components:

```tsx
import { render, screen } from "@testing-library/react";
import { MyContextProvider, useMyContext } from "@/contexts/MyContext";

// Test component that uses the context
const TestComponent = () => {
  const { value, updateValue } = useMyContext();
  return (
    <div>
      <span>Value: {value}</span>
      <button onClick={() => updateValue("new")}>Update</button>
    </div>
  );
};

describe("MyContextProvider", () => {
  it("should provide initial context value", () => {
    render(
      <MyContextProvider>
        <TestComponent />
      </MyContextProvider>,
    );

    expect(screen.getByText("Value: initial")).toBeInTheDocument();
  });
});
```

## Common Context Test Patterns

- **Provider state**: Test initial state and state updates
- **Context consumers**: Test components that use the context
- **Error boundaries**: Test error handling in providers
- **Multiple providers**: Test provider composition

## Import Path

```tsx
import { render } from "../test-utils";
```
