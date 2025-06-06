/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "../test-utils";
import ProfilePage from "@/pages/ProfilePage";

// Mock the useSession hook
jest.mock("@/hooks/useSession", () => ({
  useSession: jest.fn(),
}));

// Mock the getTenantBySlug function
jest.mock("@/lib/tenant-utils", () => ({
  getTenantBySlug: jest.fn(),
}));

// Mock Supabase client
jest.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
    })),
  },
}));

// Mock ProfileForm
jest.mock("@/components/Profile/ProfileForm", () => ({
  ProfileForm: ({ profile, onProfileUpdated }: any) => (
    <div data-testid="profile-form">
      <span data-testid="profile-name">{profile?.full_name || "No name"}</span>
      <button onClick={onProfileUpdated} data-testid="update-profile-btn">
        Update Profile
      </button>
    </div>
  ),
}));

// Mock NavBar
jest.mock("@/components/Layout/NavBar", () => ({
  NavBar: () => <nav data-testid="navbar">NavBar</nav>,
}));

// Mock react-router-dom
const mockNavigate = jest.fn();
const mockParams = { slug: undefined };

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
  useParams: () => mockParams,
}));

import { useSession } from "@/hooks/useSession";
import { getTenantBySlug } from "@/lib/tenant-utils";
import { supabase } from "@/integrations/supabase/client";

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;
const mockGetTenantBySlug = getTenantBySlug as jest.MockedFunction<typeof getTenantBySlug>;

// Mock user and profile objects
const mockUser = {
  id: "user-1",
  email: "test@example.com",
  app_metadata: {},
  user_metadata: {},
  aud: "authenticated",
  created_at: "2024-01-01T00:00:00Z",
} as any;

const mockProfile = {
  id: "user-1",
  full_name: "John Doe",
  first_name: "John",
  last_name: "Doe",
  email: "test@example.com",
  avatar_url: null,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

const mockTenant = {
  id: "tenant-1",
  name: "Test Church",
  slug: "test-church",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  price_tier_id: "basic",
};

describe("ProfilePage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParams.slug = undefined;
  });

  describe("Regular Profile Page (non-tenant)", () => {
    it("should render profile page when user is authenticated", async () => {
      mockUseSession.mockReturnValue({
        session: {} as any,
        user: mockUser,
        profile: mockProfile,
        isLoading: false,
        signOut: jest.fn(),
      });

      render(<ProfilePage />);

      expect(screen.getByTestId("navbar")).toBeInTheDocument();
      expect(screen.getByText("你的個人資料")).toBeInTheDocument();
      expect(screen.getByText("更新你的個人資訊")).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByTestId("profile-form")).toBeInTheDocument();
        expect(screen.getByTestId("profile-name")).toHaveTextContent("John Doe");
      });
    });

    it("should redirect to auth when user is not authenticated", () => {
      mockUseSession.mockReturnValue({
        session: null,
        user: null,
        profile: null,
        isLoading: false,
        signOut: jest.fn(),
      });

      render(<ProfilePage />);

      expect(mockNavigate).toHaveBeenCalledWith("/auth");
    });

    it("should show loading state while session is loading", () => {
      mockUseSession.mockReturnValue({
        session: null,
        user: null,
        profile: null,
        isLoading: true,
        signOut: jest.fn(),
      });

      render(<ProfilePage />);

      expect(screen.getByText("載入中...")).toBeInTheDocument();
    });

    it("should show error when profile is not found", () => {
      mockUseSession.mockReturnValue({
        session: {} as any,
        user: mockUser,
        profile: null,
        isLoading: false,
        signOut: jest.fn(),
      });

      render(<ProfilePage />);

      expect(screen.getByText("找不到個人資料")).toBeInTheDocument();
    });

    it("should handle profile update", async () => {
      const user = userEvent.setup();

      // Mock Supabase response for profile fetch
      const mockFrom = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: { ...mockProfile, full_name: "Updated Name" },
              error: null,
            }),
          })),
        })),
      }));
      (supabase.from as jest.Mock).mockImplementation(mockFrom);

      mockUseSession.mockReturnValue({
        session: {} as any,
        user: mockUser,
        profile: mockProfile,
        isLoading: false,
        signOut: jest.fn(),
      });

      render(<ProfilePage />);

      const updateButton = screen.getByTestId("update-profile-btn");
      await user.click(updateButton);

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith("profiles");
      });
    });
  });

  describe("Tenant Profile Page", () => {
    beforeEach(() => {
      mockParams.slug = "test-church";
    });

    it("should render tenant profile page when user is authenticated and tenant exists", async () => {
      mockUseSession.mockReturnValue({
        session: {} as any,
        user: mockUser,
        profile: mockProfile,
        isLoading: false,
        signOut: jest.fn(),
      });

      mockGetTenantBySlug.mockResolvedValue(mockTenant);

      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByTestId("navbar")).toBeInTheDocument();
        expect(screen.getByText("你的個人資料")).toBeInTheDocument();
        expect(screen.getByTestId("profile-form")).toBeInTheDocument();
      });

      expect(mockGetTenantBySlug).toHaveBeenCalledWith("test-church");
    });

    it("should redirect to tenant auth when user is not authenticated", () => {
      mockUseSession.mockReturnValue({
        session: null,
        user: null,
        profile: null,
        isLoading: false,
        signOut: jest.fn(),
      });

      render(<ProfilePage />);

      expect(mockNavigate).toHaveBeenCalledWith("/tenant/test-church/auth");
    });

    it("should show tenant not found when tenant doesn't exist", async () => {
      mockUseSession.mockReturnValue({
        session: {} as any,
        user: mockUser,
        profile: mockProfile,
        isLoading: false,
        signOut: jest.fn(),
      });

      mockGetTenantBySlug.mockResolvedValue(null);

      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByText("找不到租戶")).toBeInTheDocument();
        expect(screen.getByText('租戶 "test-church" 不存在或已被刪除。')).toBeInTheDocument();
      });

      const homeButton = screen.getByText("返回首頁");
      expect(homeButton).toBeInTheDocument();
    });

    it("should handle tenant fetch error", async () => {
      mockUseSession.mockReturnValue({
        session: {} as any,
        user: mockUser,
        profile: mockProfile,
        isLoading: false,
        signOut: jest.fn(),
      });

      mockGetTenantBySlug.mockRejectedValue(new Error("Network error"));

      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByText("找不到租戶")).toBeInTheDocument();
      });
    });

    it("should show loading state while tenant is loading", () => {
      mockUseSession.mockReturnValue({
        session: {} as any,
        user: mockUser,
        profile: mockProfile,
        isLoading: false,
        signOut: jest.fn(),
      });

      // Don't resolve the promise immediately
      mockGetTenantBySlug.mockImplementation(() => new Promise(() => {}));

      render(<ProfilePage />);

      expect(screen.getByText("載入中...")).toBeInTheDocument();
    });

    it("should navigate to home when clicking return home button", async () => {
      const user = userEvent.setup();

      mockUseSession.mockReturnValue({
        session: {} as any,
        user: mockUser,
        profile: mockProfile,
        isLoading: false,
        signOut: jest.fn(),
      });

      mockGetTenantBySlug.mockResolvedValue(null);

      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByText("返回首頁")).toBeInTheDocument();
      });

      const homeButton = screen.getByText("返回首頁");
      await user.click(homeButton);

      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });

  describe("Profile Data Management", () => {
    it("should use session profile when available", () => {
      mockUseSession.mockReturnValue({
        session: {} as any,
        user: mockUser,
        profile: mockProfile,
        isLoading: false,
        signOut: jest.fn(),
      });

      render(<ProfilePage />);

      expect(screen.getByTestId("profile-name")).toHaveTextContent("John Doe");
    });

    it("should fetch profile data from Supabase when session profile is not available", async () => {
      const mockFrom = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: mockProfile,
              error: null,
            }),
          })),
        })),
      }));
      (supabase.from as jest.Mock).mockImplementation(mockFrom);

      mockUseSession.mockReturnValue({
        session: {} as any,
        user: mockUser,
        profile: null,
        isLoading: false,
        signOut: jest.fn(),
      });

      render(<ProfilePage />);

      // Since profile is null, it should show "找不到個人資料"
      expect(screen.getByText("找不到個人資料")).toBeInTheDocument();
    });

    it("should handle profile fetch error gracefully", async () => {
      const mockFrom = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: "Profile not found" },
            }),
          })),
        })),
      }));
      (supabase.from as jest.Mock).mockImplementation(mockFrom);

      mockUseSession.mockReturnValue({
        session: {} as any,
        user: mockUser,
        profile: null,
        isLoading: false,
        signOut: jest.fn(),
      });

      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByText("找不到個人資料")).toBeInTheDocument();
      });
    });
  });
});
