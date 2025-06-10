/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render, mockUseSessionHelpers } from "../../test-utils";
import { NavBar } from "@/components/Layout/NavBar";

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

import { supabase } from "@/integrations/supabase/client";

describe("NavBar", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocation.pathname = "/";
  });

  describe("Rendering", () => {
    it("should render with unauthenticated user", () => {
      mockUseSessionHelpers.unauthenticated();

      render(<NavBar />);

      expect(screen.getByText("Chabod")).toBeInTheDocument();
      expect(screen.getByTestId("language-switcher")).toBeInTheDocument();
      expect(screen.getByText("nav.login")).toBeInTheDocument();
      expect(screen.getByText("nav.signup")).toBeInTheDocument();
    });

    it("should render with authenticated user", () => {
      mockUseSessionHelpers.authenticatedNoProfile();

      render(<NavBar />);

      expect(screen.getByText("Chabod")).toBeInTheDocument();
      expect(screen.getByText("nav.dashboard")).toBeInTheDocument();
      expect(screen.getByText("nav.profile")).toBeInTheDocument();
      expect(screen.getByText("nav.logout")).toBeInTheDocument();
    });
  });

  describe("Logo Navigation Behavior", () => {
    beforeEach(() => {
      mockUseSessionHelpers.unauthenticated();
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
      mockUseSessionHelpers.authenticatedNoProfile();

      (supabase.auth.signOut as jest.Mock).mockResolvedValue({});

      render(<NavBar />);

      const logoutButton = screen.getByText("nav.logout");
      await user.click(logoutButton);

      await waitFor(() => {
        expect(supabase.auth.signOut).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "auth.loggedOut",
          description: "auth.loggedOutSuccess",
        });
      });
    });

    it("should handle sign out error", async () => {
      const user = userEvent.setup();
      mockUseSessionHelpers.authenticatedNoProfile();

      (supabase.auth.signOut as jest.Mock).mockRejectedValue(new Error("Sign out failed"));

      render(<NavBar />);

      const logoutButton = screen.getByText("nav.logout");
      await user.click(logoutButton);

      await waitFor(() => {
        expect(supabase.auth.signOut).toHaveBeenCalled();
      });
    });
  });

  describe("Navigation Links", () => {
    it("should render correct login link with redirect when not on root", () => {
      mockLocation.pathname = "/some-path";
      mockUseSessionHelpers.unauthenticated();

      render(<NavBar />);

      const loginLink = screen.getByText("nav.login").closest("a");
      expect(loginLink).toHaveAttribute("href", "/auth?redirect=%2Fsome-path");
    });

    it("should render correct login link without redirect on root", () => {
      mockLocation.pathname = "/";
      mockUseSessionHelpers.unauthenticated();

      render(<NavBar />);

      const loginLink = screen.getByText("nav.login").closest("a");
      expect(loginLink).toHaveAttribute("href", "/auth");
    });
  });
});
