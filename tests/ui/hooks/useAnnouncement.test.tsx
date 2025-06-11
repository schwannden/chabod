import { renderHook, act } from "@testing-library/react";

// Unmock the useAnnouncement hook since we're testing the real implementation
jest.unmock("@/hooks/useAnnouncement");

// Also unmock react-i18next for this test file to test the real implementation
jest.unmock("react-i18next");

import { useAnnouncement } from "@/hooks/useAnnouncement";

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  key: jest.fn(),
  length: 0,
};

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Mock react-i18next for this specific test file
const mockUseTranslation = jest.fn();

jest.mock("react-i18next", () => ({
  useTranslation: () => mockUseTranslation(),
}));

describe("useAnnouncement", () => {
  const defaultMockTranslation = {
    t: (key: string) => key,
    ready: true,
    i18n: {
      language: "en",
      getResourceBundle: (lang: string, namespace: string) => {
        if (namespace === "announcements") {
          return {
            testAnnouncement: {
              title: "Test Title",
              message: "Test Message",
              icon: "warning",
              dontShowAgain: "Don't show again",
              understood: "Got it",
            },
          };
        }
        return null;
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset all keys in localStorageMock
    Object.keys(localStorageMock).forEach((key) => {
      if (
        typeof localStorageMock[key] === "function" &&
        typeof localStorageMock[key].mockReset === "function"
      ) {
        localStorageMock[key].mockReset();
      }
    });
    mockUseTranslation.mockReturnValue({ ...defaultMockTranslation });
  });

  it("should initialize with no announcements when i18n is not ready", () => {
    mockUseTranslation.mockReturnValue({
      ...defaultMockTranslation,
      ready: false,
    });

    const { result } = renderHook(() => useAnnouncement());

    expect(result.current.isOpen).toBe(false);
    expect(result.current.currentAnnouncement).toBe(null);
  });

  it("should show announcement when valid announcement exists", () => {
    const { result } = renderHook(() => useAnnouncement());

    expect(result.current.isOpen).toBe(true);
    expect(result.current.currentAnnouncement).toEqual({
      id: "testAnnouncement",
      title: "Test Title",
      message: "Test Message",
      icon: "warning",
      dontShowAgain: "Don't show again",
      understood: "Got it",
    });
  });

  it("should not show announcement if it was dismissed permanently", () => {
    const dismissalData = {
      dismissed: true,
      timestamp: Date.now(),
    };
    localStorageMock.getItem.mockReturnValue(JSON.stringify(dismissalData));

    const { result } = renderHook(() => useAnnouncement());

    expect(result.current.isOpen).toBe(false);
    expect(result.current.currentAnnouncement).toBe(null);
  });

  it("should show announcement if dismissal has expired", () => {
    const expiredTimestamp = Date.now() - 61 * 24 * 60 * 60 * 1000;
    const dismissalData = {
      dismissed: true,
      timestamp: expiredTimestamp,
    };
    localStorageMock.getItem.mockReturnValue(JSON.stringify(dismissalData));

    const { result } = renderHook(() => useAnnouncement());

    expect(result.current.isOpen).toBe(true);
    expect(result.current.currentAnnouncement).toEqual({
      id: "testAnnouncement",
      title: "Test Title",
      message: "Test Message",
      icon: "warning",
      dontShowAgain: "Don't show again",
      understood: "Got it",
    });

    expect(localStorageMock.removeItem).toHaveBeenCalledWith(
      "chabod-announcement-dismissed-testAnnouncement",
    );
  });

  it("should dismiss announcement without saving when dontShowAgain is false", async () => {
    const { result } = renderHook(() => useAnnouncement());

    expect(result.current.isOpen).toBe(true);

    await act(async () => {
      result.current.dismissAnnouncement(false);
      await new Promise((resolve) => setTimeout(resolve, 150));
    });

    expect(result.current.isOpen).toBe(false);
    expect(localStorageMock.setItem).not.toHaveBeenCalled();
  });

  it("should dismiss announcement and save when dontShowAgain is true", async () => {
    const { result } = renderHook(() => useAnnouncement());

    expect(result.current.isOpen).toBe(true);

    await act(async () => {
      result.current.dismissAnnouncement(true);
      await new Promise((resolve) => setTimeout(resolve, 150));
    });

    expect(result.current.isOpen).toBe(false);
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "chabod-announcement-dismissed-testAnnouncement",
      expect.stringContaining('"dismissed":true'),
    );
  });

  it("should reset all announcements", async () => {
    // Initially return dismissal data to simulate dismissed announcement
    localStorageMock.getItem.mockReturnValue(
      JSON.stringify({ dismissed: true, timestamp: Date.now() }),
    );

    // Mock Object.keys for localStorage to return our test keys
    const originalObjectKeys = Object.keys;
    const mockKeys = [
      "chabod-announcement-dismissed-testAnnouncement",
      "chabod-announcement-dismissed-anotherAnnouncement",
      "some-other-key",
    ];

    Object.keys = jest.fn().mockImplementation((obj) => {
      if (obj === localStorage) {
        return mockKeys;
      }
      return originalObjectKeys(obj);
    });

    const { result } = renderHook(() => useAnnouncement());

    expect(result.current.isOpen).toBe(false);

    // After reset is called, getItem should return null (no dismissals)
    await act(async () => {
      localStorageMock.getItem.mockReturnValue(null);
      result.current.resetAnnouncements();
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.currentAnnouncement?.id).toBe("testAnnouncement");

    expect(localStorageMock.removeItem).toHaveBeenCalledWith(
      "chabod-announcement-dismissed-testAnnouncement",
    );
    expect(localStorageMock.removeItem).toHaveBeenCalledWith(
      "chabod-announcement-dismissed-anotherAnnouncement",
    );
    // Should not remove the non-announcement key
    expect(localStorageMock.removeItem).not.toHaveBeenCalledWith("some-other-key");

    // Restore Object.keys
    Object.keys = originalObjectKeys;
  });

  it("should handle errors in scanning announcements gracefully", () => {
    mockUseTranslation.mockReturnValue({
      ...defaultMockTranslation,
      i18n: {
        language: "en",
        getResourceBundle: (lang: string, namespace: string) => {
          throw new Error("Resource bundle error");
        },
      },
    });

    const { result } = renderHook(() => useAnnouncement());

    expect(result.current.isOpen).toBe(false);
    expect(result.current.currentAnnouncement).toBe(null);
  });

  it("should ignore invalid announcement objects", () => {
    // Clear localStorage to ensure no existing dismissals
    localStorageMock.getItem.mockReturnValue(null);

    mockUseTranslation.mockReturnValue({
      ...defaultMockTranslation,
      i18n: {
        language: "en",
        getResourceBundle: (lang: string, namespace: string) => {
          if (namespace === "announcements") {
            return {
              invalidAnnouncement: {
                icon: "warning",
                // Missing title and message - should be ignored
              },
              validAnnouncement: {
                title: "Valid Title",
                message: "Valid Message",
              },
            };
          }
          return null;
        },
      },
    });

    const { result } = renderHook(() => useAnnouncement());

    expect(result.current.isOpen).toBe(true);
    expect(result.current.currentAnnouncement?.id).toBe("validAnnouncement");
  });

  it("should handle malformed dismissal data", () => {
    localStorageMock.getItem.mockReturnValue("invalid json");

    const { result } = renderHook(() => useAnnouncement());

    expect(result.current.isOpen).toBe(true);
    expect(result.current.currentAnnouncement?.id).toBe("testAnnouncement");
    expect(localStorageMock.removeItem).toHaveBeenCalledWith(
      "chabod-announcement-dismissed-testAnnouncement",
    );
  });

  it("should handle missing announcements section", () => {
    mockUseTranslation.mockReturnValue({
      ...defaultMockTranslation,
      i18n: {
        language: "en",
        getResourceBundle: (lang: string, namespace: string) => {
          if (namespace === "announcements") {
            return {};
          }
          return null;
        },
      },
    });

    const { result } = renderHook(() => useAnnouncement());

    expect(result.current.isOpen).toBe(false);
    expect(result.current.currentAnnouncement).toBe(null);
  });
});
