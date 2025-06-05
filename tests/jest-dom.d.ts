import "@testing-library/jest-dom";

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toBeVisible(): R;
      toBeEnabled(): R;
      toBeDisabled(): R;
      toHaveClass(className: string): R;
      toHaveTextContent(text: string | RegExp): R;
      toHaveValue(value: string | number): R;
      toBeChecked(): R;
      toHaveFocus(): R;
      toHaveAttribute(attr: string, value?: string): R;
      toBeEmptyDOMElement(): R;
      toContainElement(element: HTMLElement | null): R;
      toHaveDisplayValue(value: string | RegExp | (string | RegExp)[]): R;
      toHaveFormValues(expectedValues: Record<string, unknown>): R;
      toHaveStyle(css: string | Record<string, unknown>): R;
      toBeInvalid(): R;
      toBeValid(): R;
      toBeRequired(): R;
      toHaveAccessibleDescription(expectedAccessibleDescription?: string | RegExp): R;
      toHaveAccessibleName(expectedAccessibleName?: string | RegExp): R;
      toHaveErrorMessage(expectedErrorMessage?: string | RegExp): R;
    }
  }

  let mockClipboardWriteText: jest.Mock;
}

export {};
