/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "../../test-utils";
import { NavBar } from "@/components/Layout/NavBar";

// Mock the useSession hook
jest.mock("@/hooks/useSession", () => ({
  useSession: jest.fn(),
}));

// Mock Supabase client
jest.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      signOut: jest.fn(),
    },
  },
}));

// Mock react-router-dom to control location
const mockNavigate = jest.fn();
const mockLocation = { pathname: "/" };

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useLocation: () => mockLocation,
  useNavigate: () => mockNavigate,
  Link: ({ to, children, ...props }: any) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

// Mock the toast hook
const mockToast = jest.fn();
jest.mock("@/components/ui/use-toast", () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

// Mock LanguageSwitcher
jest.mock("@/components/shared/LanguageSwitcher", () => ({
  LanguageSwitcher: () => <div data-testid="language-switcher">Language Switcher</div>,
}));

import { useSession } from "@/hooks/useSession";
import { supabase } from "@/integrations/supabase/client";

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;

// Mock user object that satisfies the User type
const mockUser = {
  id: "user-1",
  email: "test@example.com",
  app_metadata: {},
  user_metadata: {},
  aud: "authenticated",
  created_at: "2024-01-01T00:00:00Z",
} as any;

// Mock session objects for consistent testing
const mockAuthenticatedSession = {
  session: {} as any,
  user: mockUser,
  profile: null,
  isLoading: false,
  signOut: jest.fn(),
};

const mockUnauthenticatedSession = {
  session: null,
  user: null,
  profile: null,
  isLoading: false,
  signOut: jest.fn(),
};

describe("NavBar", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocation.pathname = "/";
  });

  describe("Rendering", () => {
    it("should render with unauthenticated user", () => {
      mockUseSession.mockReturnValue(mockUnauthenticatedSession);

      render(<NavBar />);

      expect(screen.getByText("Chabod")).toBeInTheDocument();
      expect(screen.getByTestId("language-switcher")).toBeInTheDocument();
      expect(screen.getByText("nav.login")).toBeInTheDocument();
      expect(screen.getByText("nav.signup")).toBeInTheDocument();
    });

    it("should render with authenticated user", () => {
      mockUseSession.mockReturnValue(mockAuthenticatedSession);

      render(<NavBar />);

      expect(screen.getByText("Chabod")).toBeInTheDocument();
      expect(screen.getByText("nav.dashboard")).toBeInTheDocument();
      expect(screen.getByText("nav.profile")).toBeInTheDocument();
      expect(screen.getByText("nav.logout")).toBeInTheDocument();
    });
  });

  describe("Logo Navigation Behavior", () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue(mockUnauthenticatedSession);
    });

    it("should link to '/' when on root path", () => {
      mockLocation.pathname = "/";
      render(<NavBar />);

      const logoLink = screen.getByText("Chabod").closest("a");
      expect(logoLink).toHaveAttribute("href", "/");
    });

    it("should link to '/' when on dashboard path", () => {
      mockLocation.pathname = "/dashboard";
      render(<NavBar />);

      const logoLink = screen.getByText("Chabod").closest("a");
      expect(logoLink).toHaveAttribute("href", "/");
    });

    it("should link to '/dashboard' when on profile path", () => {
      mockLocation.pathname = "/profile";
      render(<NavBar />);

      const logoLink = screen.getByText("Chabod").closest("a");
      expect(logoLink).toHaveAttribute("href", "/dashboard");
    });

    it("should link to tenant dashboard when on tenant root path", () => {
      mockLocation.pathname = "/tenant/my-church";
      render(<NavBar />);

      const logoLink = screen.getByText("Chabod").closest("a");
      expect(logoLink).toHaveAttribute("href", "/tenant/my-church");
    });

    it("should link to tenant dashboard when on tenant members path", () => {
      mockLocation.pathname = "/tenant/my-church/members";
      render(<NavBar />);

      const logoLink = screen.getByText("Chabod").closest("a");
      expect(logoLink).toHaveAttribute("href", "/tenant/my-church");
    });

    it("should link to tenant dashboard when on tenant profile path", () => {
      mockLocation.pathname = "/tenant/my-church/profile";
      render(<NavBar />);

      const logoLink = screen.getByText("Chabod").closest("a");
      expect(logoLink).toHaveAttribute("href", "/tenant/my-church");
    });

    it("should link to tenant dashboard when on nested tenant path", () => {
      mockLocation.pathname = "/tenant/my-church/groups/group-123";
      render(<NavBar />);

      const logoLink = screen.getByText("Chabod").closest("a");
      expect(logoLink).toHaveAttribute("href", "/tenant/my-church");
    });

    it("should handle complex tenant slugs with hyphens", () => {
      mockLocation.pathname = "/tenant/first-baptist-church/events";
      render(<NavBar />);

      const logoLink = screen.getByText("Chabod").closest("a");
      expect(logoLink).toHaveAttribute("href", "/tenant/first-baptist-church");
    });

    it("should link to '/' for unknown paths", () => {
      mockLocation.pathname = "/some-unknown-path";
      render(<NavBar />);

      const logoLink = screen.getByText("Chabod").closest("a");
      expect(logoLink).toHaveAttribute("href", "/");
    });
  });

  describe("User Authentication Actions", () => {
    it("should handle sign out successfully", async () => {
      const user = userEvent.setup();
      mockUseSession.mockReturnValue(mockAuthenticatedSession as any);

      (supabase.auth.signOut as jest.Mock).mockResolvedValue({});

      render(<NavBar />);

      const logoutButton = screen.getByText("nav.logout");
      await user.click(logoutButton);

      await waitFor(() => {
        expect(supabase.auth.signOut).toHaveBeenCalled();
        expect(mockToast).toHaveBeenCalledWith({
          title: "auth.loggedOut",
          description: "auth.loggedOutSuccess",
        });
      });
    });

    it("should handle sign out error", async () => {
      const user = userEvent.setup();
      mockUseSession.mockReturnValue(mockAuthenticatedSession as any);

      const signOutError = new Error("Sign out failed");
      (supabase.auth.signOut as jest.Mock).mockRejectedValue(signOutError);

      render(<NavBar />);

      const logoutButton = screen.getByText("nav.logout");
      await user.click(logoutButton);

      await waitFor(() => {
        expect(supabase.auth.signOut).toHaveBeenCalled();
        expect(mockToast).toHaveBeenCalledWith({
          title: "auth.logoutError",
          description: "auth.logoutError",
          variant: "destructive",
        });
      });
    });
  });

  describe("Navigation Links", () => {
    it("should render correct login link with redirect when not on root", () => {
      mockLocation.pathname = "/some-page";
      mockUseSession.mockReturnValue({
        session: null,
        user: null,
        profile: null,
        isLoading: false,
        signOut: jest.fn(),
      });

      render(<NavBar />);

      const loginLink = screen.getByText("nav.login").closest("a");
      expect(loginLink).toHaveAttribute("href", "/auth?redirect=%2Fsome-page");
    });

    it("should render login link without redirect when on root", () => {
      mockLocation.pathname = "/";
      mockUseSession.mockReturnValue({
        session: null,
        user: null,
        profile: null,
        isLoading: false,
        signOut: jest.fn(),
      });

      render(<NavBar />);

      const loginLink = screen.getByText("nav.login").closest("a");
      expect(loginLink).toHaveAttribute("href", "/auth");
    });

    it("should render signup link", () => {
      mockUseSession.mockReturnValue({
        session: null,
        user: null,
        profile: null,
        isLoading: false,
        signOut: jest.fn(),
      });

      render(<NavBar />);

      const signupLink = screen.getByText("nav.signup").closest("a");
      expect(signupLink).toHaveAttribute("href", "/auth?tab=signup");
    });

    it("should render dashboard and profile links when authenticated", () => {
      mockUseSession.mockReturnValue({
        session: {} as any,
        user: mockUser,
        profile: null,
        isLoading: false,
        signOut: jest.fn(),
      });

      render(<NavBar />);

      const dashboardLink = screen.getByText("nav.dashboard").closest("a");
      const profileLink = screen.getByText("nav.profile").closest("a");

      expect(dashboardLink).toHaveAttribute("href", "/dashboard");
      expect(profileLink).toHaveAttribute("href", "/profile");
    });
  });

  describe("Accessibility", () => {
    it("should have proper navigation landmark", () => {
      mockUseSession.mockReturnValue({
        session: null,
        user: null,
        profile: null,
        isLoading: false,
        signOut: jest.fn(),
      });

      render(<NavBar />);

      const nav = screen.getByRole("navigation");
      expect(nav).toBeInTheDocument();
    });

    it("should have clickable logo link", () => {
      mockUseSession.mockReturnValue({
        session: null,
        user: null,
        profile: null,
        isLoading: false,
        signOut: jest.fn(),
      });

      render(<NavBar />);

      const logoLink = screen.getByRole("link", { name: "Chabod" });
      expect(logoLink).toBeInTheDocument();
    });

    it("should have accessible buttons and links", () => {
      mockUseSession.mockReturnValue({
        session: {} as any,
        user: mockUser,
        profile: null,
        isLoading: false,
        signOut: jest.fn(),
      });

      render(<NavBar />);

      expect(screen.getByRole("link", { name: /nav.dashboard/ })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "nav.profile" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /nav.logout/ })).toBeInTheDocument();
    });
  });

  describe("Profile Navigation Behavior", () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue(mockAuthenticatedSession);
    });

    it("should link to '/profile' when on root path", () => {
      mockLocation.pathname = "/";
      render(<NavBar />);

      const profileLink = screen.getByText("nav.profile").closest("a");
      expect(profileLink).toHaveAttribute("href", "/profile");
    });

    it("should link to '/profile' when on dashboard path", () => {
      mockLocation.pathname = "/dashboard";
      render(<NavBar />);

      const profileLink = screen.getByText("nav.profile").closest("a");
      expect(profileLink).toHaveAttribute("href", "/profile");
    });

    it("should link to '/profile' when on profile path", () => {
      mockLocation.pathname = "/profile";
      render(<NavBar />);

      const profileLink = screen.getByText("nav.profile").closest("a");
      expect(profileLink).toHaveAttribute("href", "/profile");
    });

    it("should link to tenant profile when on tenant root path", () => {
      mockLocation.pathname = "/tenant/my-church";
      render(<NavBar />);

      const profileLink = screen.getByText("nav.profile").closest("a");
      expect(profileLink).toHaveAttribute("href", "/tenant/my-church/profile");
    });

    it("should link to tenant profile when on tenant members path", () => {
      mockLocation.pathname = "/tenant/my-church/members";
      render(<NavBar />);

      const profileLink = screen.getByText("nav.profile").closest("a");
      expect(profileLink).toHaveAttribute("href", "/tenant/my-church/profile");
    });

    it("should link to tenant profile when on tenant profile path", () => {
      mockLocation.pathname = "/tenant/my-church/profile";
      render(<NavBar />);

      const profileLink = screen.getByText("nav.profile").closest("a");
      expect(profileLink).toHaveAttribute("href", "/tenant/my-church/profile");
    });

    it("should link to tenant profile when on nested tenant path", () => {
      mockLocation.pathname = "/tenant/my-church/groups/group-123";
      render(<NavBar />);

      const profileLink = screen.getByText("nav.profile").closest("a");
      expect(profileLink).toHaveAttribute("href", "/tenant/my-church/profile");
    });

    it("should handle different tenant slugs", () => {
      mockLocation.pathname = "/tenant/first-baptist-church/events";
      render(<NavBar />);

      const profileLink = screen.getByText("nav.profile").closest("a");
      expect(profileLink).toHaveAttribute("href", "/tenant/first-baptist-church/profile");
    });

    it("should link to '/profile' for unknown paths", () => {
      mockLocation.pathname = "/some-unknown-path";
      render(<NavBar />);

      const profileLink = screen.getByText("nav.profile").closest("a");
      expect(profileLink).toHaveAttribute("href", "/profile");
    });

    it("should handle malformed tenant paths", () => {
      mockLocation.pathname = "/tenant/";
      render(<NavBar />);

      const profileLink = screen.getByText("nav.profile").closest("a");
      expect(profileLink).toHaveAttribute("href", "/profile");
    });
  });

  describe("Complete Route Navigation Specification", () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        session: null,
        user: null,
        profile: null,
        isLoading: false,
        signOut: jest.fn(),
      });
    });

    it("should follow the complete navigation specification for all route scenarios", () => {
      // Test all the specified navigation behaviors in sequence
      const scenarios = [
        // Group 1: clicking logo should go to / if we are on / or /dashboard
        { currentPath: "/", expectedDestination: "/" },
        { currentPath: "/dashboard", expectedDestination: "/" },

        // Group 2: clicking logo should go to /dashboard if we are on /profile
        { currentPath: "/profile", expectedDestination: "/dashboard" },

        // Group 3: clicking logo should go to /tenant/{slug} if we are on any path within /tenant/{slug}
        { currentPath: "/tenant/my-church", expectedDestination: "/tenant/my-church" },
        { currentPath: "/tenant/my-church/auth", expectedDestination: "/tenant/my-church" },
        { currentPath: "/tenant/my-church/members", expectedDestination: "/tenant/my-church" },
        { currentPath: "/tenant/my-church/groups", expectedDestination: "/tenant/my-church" },
        { currentPath: "/tenant/my-church/events", expectedDestination: "/tenant/my-church" },
        {
          currentPath: "/tenant/my-church/groups/group-123",
          expectedDestination: "/tenant/my-church",
        },
        { currentPath: "/tenant/my-church/profile", expectedDestination: "/tenant/my-church" },
        { currentPath: "/tenant/my-church/resources", expectedDestination: "/tenant/my-church" },
        { currentPath: "/tenant/my-church/services", expectedDestination: "/tenant/my-church" },
        {
          currentPath: "/tenant/my-church/service_events",
          expectedDestination: "/tenant/my-church",
        },

        // Additional tenant scenarios with different slugs
        {
          currentPath: "/tenant/first-baptist/members",
          expectedDestination: "/tenant/first-baptist",
        },
        {
          currentPath: "/tenant/st-mary-cathedral/events",
          expectedDestination: "/tenant/st-mary-cathedral",
        },
      ];

      scenarios.forEach(({ currentPath, expectedDestination }, index) => {
        // Set the current path
        mockLocation.pathname = currentPath;

        // Render fresh for each scenario
        const { unmount } = render(<NavBar />);

        // Check the logo destination
        const logoLink = screen.getByText("Chabod").closest("a");
        expect(logoLink).toHaveAttribute("href", expectedDestination);

        console.log(`✓ Scenario ${index + 1}: ${currentPath} → ${expectedDestination}`);

        // Clean up for next iteration
        unmount();
      });
    });

    it("should handle edge cases for tenant paths", () => {
      const edgeCases = [
        // Path with multiple segments
        {
          currentPath: "/tenant/my-church/groups/123/members",
          expectedDestination: "/tenant/my-church",
        },
        // Path with special characters in tenant slug
        {
          currentPath: "/tenant/st-john_the-baptist/events",
          expectedDestination: "/tenant/st-john_the-baptist",
        },
        // Deep nested path
        {
          currentPath: "/tenant/community-church/resources/category/item/edit",
          expectedDestination: "/tenant/community-church",
        },
      ];

      edgeCases.forEach(({ currentPath, expectedDestination }) => {
        mockLocation.pathname = currentPath;
        const { unmount } = render(<NavBar />);

        const logoLink = screen.getByText("Chabod").closest("a");
        expect(logoLink).toHaveAttribute("href", expectedDestination);

        unmount();
      });
    });

    it("should handle malformed or invalid tenant paths", () => {
      const invalidCases = [
        // Missing tenant slug
        { currentPath: "/tenant/", expectedDestination: "/" },
        // Incomplete tenant path
        { currentPath: "/tenant", expectedDestination: "/" },
        // Non-tenant paths that might look similar
        { currentPath: "/tenants/list", expectedDestination: "/" },
        { currentPath: "/tenant-admin", expectedDestination: "/" },
      ];

      invalidCases.forEach(({ currentPath, expectedDestination }) => {
        mockLocation.pathname = currentPath;
        const { unmount } = render(<NavBar />);

        const logoLink = screen.getByText("Chabod").closest("a");
        expect(logoLink).toHaveAttribute("href", expectedDestination);

        unmount();
      });
    });
  });
});
