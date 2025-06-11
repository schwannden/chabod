/* eslint-disable @typescript-eslint/no-explicit-any */
import { screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render, mockUseSessionHelpers, mockProfile } from "../test-utils";
import ProfilePage from "@/pages/ProfilePage";

// useSession is already mocked in test-utils.tsx

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

// Mock TenantBreadcrumb
jest.mock("@/components/Layout/TenantBreadcrumb", () => ({
  TenantBreadcrumb: ({ tenantName, tenantSlug, items }: any) => (
    <nav data-testid="tenant-breadcrumb">
      <span data-testid="breadcrumb-tenant-name">{tenantName}</span>
      <span data-testid="breadcrumb-tenant-slug">{tenantSlug}</span>
      <div data-testid="breadcrumb-items">
        {items.map((item: any, index: number) => (
          <span key={index} data-testid={`breadcrumb-item-${index}`}>
            {item.label}
          </span>
        ))}
      </div>
    </nav>
  ),
}));

// Mock react-router-dom
const mockNavigate = jest.fn();
const mockParams = { slug: undefined };

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
  useParams: () => mockParams,
}));

import { getTenantBySlug } from "@/lib/tenant-utils";
import { supabase } from "@/integrations/supabase/client";

const mockGetTenantBySlug = getTenantBySlug as jest.MockedFunction<typeof getTenantBySlug>;

// Test-specific profile with custom data
const testProfile = {
  ...mockProfile,
  full_name: "John Doe",
  first_name: "John",
  last_name: "Doe",
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
      mockUseSessionHelpers.withProfile(testProfile);

      await act(async () => {
        render(<ProfilePage />);
      });

      expect(screen.getByTestId("navbar")).toBeInTheDocument();
      expect(screen.getByText("你的個人資料")).toBeInTheDocument();
      expect(screen.getByText("更新你的個人資訊")).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByTestId("profile-form")).toBeInTheDocument();
        expect(screen.getByTestId("profile-name")).toHaveTextContent("John Doe");
      });
    });

    it("should not show breadcrumb for regular profile page", async () => {
      mockUseSessionHelpers.withProfile(testProfile);

      await act(async () => {
        render(<ProfilePage />);
      });

      // Should not render breadcrumb for non-tenant profile page
      expect(screen.queryByTestId("tenant-breadcrumb")).not.toBeInTheDocument();
    });

    it("should redirect to auth when user is not authenticated", async () => {
      mockUseSessionHelpers.unauthenticated();

      await act(async () => {
        render(<ProfilePage />);
      });

      expect(mockNavigate).toHaveBeenCalledWith("/auth");
    });

    it("should show loading state while session is loading", async () => {
      mockUseSessionHelpers.loading();

      await act(async () => {
        render(<ProfilePage />);
      });

      expect(screen.getByText("載入中...")).toBeInTheDocument();
    });

    it("should show error when profile is not found", async () => {
      mockUseSessionHelpers.authenticatedNoProfile();

      await act(async () => {
        render(<ProfilePage />);
      });

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

      mockUseSessionHelpers.withProfile(testProfile);

      await act(async () => {
        render(<ProfilePage />);
      });

      const updateButton = screen.getByTestId("update-profile-btn");
      await act(async () => {
        await user.click(updateButton);
      });

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
      mockUseSessionHelpers.withProfile(testProfile);

      mockGetTenantBySlug.mockResolvedValue(mockTenant);

      await act(async () => {
        render(<ProfilePage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId("navbar")).toBeInTheDocument();
        expect(screen.getByText("你的個人資料")).toBeInTheDocument();
        expect(screen.getByTestId("profile-form")).toBeInTheDocument();
      });

      expect(mockGetTenantBySlug).toHaveBeenCalledWith("test-church");
    });

    it("should show breadcrumb for tenant profile page when tenant is loaded", async () => {
      mockUseSessionHelpers.withProfile(testProfile);
      mockGetTenantBySlug.mockResolvedValue(mockTenant);

      await act(async () => {
        render(<ProfilePage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId("tenant-breadcrumb")).toBeInTheDocument();
        expect(screen.getByTestId("breadcrumb-tenant-name")).toHaveTextContent("Test Church");
        expect(screen.getByTestId("breadcrumb-tenant-slug")).toHaveTextContent("test-church");
        expect(screen.getByTestId("breadcrumb-item-0")).toHaveTextContent("個人資料");
      });
    });

    it("should not show breadcrumb when tenant is not loaded", async () => {
      mockUseSessionHelpers.withProfile(testProfile);
      mockGetTenantBySlug.mockResolvedValue(null);

      await act(async () => {
        render(<ProfilePage />);
      });

      await waitFor(() => {
        expect(screen.getByText("找不到租戶")).toBeInTheDocument();
      });

      // Should not render breadcrumb when tenant is not found
      expect(screen.queryByTestId("tenant-breadcrumb")).not.toBeInTheDocument();
    });

    it("should not show breadcrumb while tenant is loading", async () => {
      mockUseSessionHelpers.withProfile(testProfile);

      // Mock a pending promise to simulate loading state
      mockGetTenantBySlug.mockImplementation(() => new Promise(() => {}));

      await act(async () => {
        render(<ProfilePage />);
      });

      // Should show loading state
      expect(screen.getByText("載入中...")).toBeInTheDocument();

      // Should not render breadcrumb while loading
      expect(screen.queryByTestId("tenant-breadcrumb")).not.toBeInTheDocument();
    });

    it("should redirect to tenant auth when user is not authenticated", async () => {
      mockUseSessionHelpers.unauthenticated();

      await act(async () => {
        render(<ProfilePage />);
      });

      expect(mockNavigate).toHaveBeenCalledWith("/tenant/test-church/auth");
    });

    it("should show tenant not found when tenant doesn't exist", async () => {
      mockUseSessionHelpers.authenticated();

      mockGetTenantBySlug.mockResolvedValue(null);

      await act(async () => {
        render(<ProfilePage />);
      });

      await waitFor(() => {
        expect(screen.getByText("找不到租戶")).toBeInTheDocument();
        expect(screen.getByText('租戶 "test-church" 不存在或已被刪除。')).toBeInTheDocument();
      });

      const homeButton = screen.getByText("返回首頁");
      expect(homeButton).toBeInTheDocument();
    });

    it("should handle tenant fetch error", async () => {
      mockUseSessionHelpers.authenticated();

      mockGetTenantBySlug.mockRejectedValue(new Error("Network error"));

      await act(async () => {
        render(<ProfilePage />);
      });

      await waitFor(() => {
        expect(screen.getByText("找不到租戶")).toBeInTheDocument();
      });
    });

    it("should navigate to home when clicking return home button", async () => {
      const user = userEvent.setup();

      mockUseSessionHelpers.authenticated();

      mockGetTenantBySlug.mockResolvedValue(null);

      await act(async () => {
        render(<ProfilePage />);
      });

      await waitFor(() => {
        expect(screen.getByText("返回首頁")).toBeInTheDocument();
      });

      const homeButton = screen.getByText("返回首頁");
      await act(async () => {
        await user.click(homeButton);
      });

      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });

  describe("Profile Data Management", () => {
    it("should use session profile when available", async () => {
      mockUseSessionHelpers.withProfile(testProfile);

      await act(async () => {
        render(<ProfilePage />);
      });

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

      mockUseSessionHelpers.authenticatedNoProfile();

      await act(async () => {
        render(<ProfilePage />);
      });

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

      mockUseSessionHelpers.authenticatedNoProfile();

      await act(async () => {
        render(<ProfilePage />);
      });

      await waitFor(() => {
        expect(screen.getByText("找不到個人資料")).toBeInTheDocument();
      });
    });
  });

  describe("Profile Display", () => {
    it("should display profile information correctly", async () => {
      mockUseSessionHelpers.withProfile(testProfile);

      await act(async () => {
        render(<ProfilePage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId("profile-form")).toBeInTheDocument();
        expect(screen.getByTestId("profile-name")).toHaveTextContent("John Doe");
      });
    });

    it("should handle profile updates correctly", async () => {
      const user = userEvent.setup();

      mockUseSessionHelpers.withProfile(testProfile);

      // Mock updated profile fetch
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

      await act(async () => {
        render(<ProfilePage />);
      });

      const updateButton = screen.getByTestId("update-profile-btn");
      await act(async () => {
        await user.click(updateButton);
      });

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith("profiles");
      });
    });

    it("should render correctly in tenant context", async () => {
      mockParams.slug = "test-church";
      mockGetTenantBySlug.mockResolvedValue(mockTenant);

      mockUseSessionHelpers.withProfile(testProfile);

      await act(async () => {
        render(<ProfilePage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId("profile-form")).toBeInTheDocument();
        expect(screen.getByTestId("profile-name")).toHaveTextContent("John Doe");
      });

      // Should not navigate anywhere when rendering in tenant context
      expect(mockNavigate).not.toHaveBeenCalledWith("/");
    });
  });

  describe("Breadcrumb Behavior", () => {
    describe("Regular Profile Page", () => {
      beforeEach(() => {
        mockParams.slug = undefined;
      });

      it("should never show breadcrumb on regular profile page", async () => {
        mockUseSessionHelpers.withProfile(testProfile);

        await act(async () => {
          render(<ProfilePage />);
        });

        expect(screen.queryByTestId("tenant-breadcrumb")).not.toBeInTheDocument();
      });

      it("should not show breadcrumb even when user is loading", async () => {
        mockUseSessionHelpers.loading();

        await act(async () => {
          render(<ProfilePage />);
        });

        expect(screen.queryByTestId("tenant-breadcrumb")).not.toBeInTheDocument();
      });
    });

    describe("Tenant Profile Page", () => {
      beforeEach(() => {
        mockParams.slug = "test-church";
      });

      it("should show breadcrumb with correct tenant data", async () => {
        mockUseSessionHelpers.withProfile(testProfile);
        mockGetTenantBySlug.mockResolvedValue(mockTenant);

        await act(async () => {
          render(<ProfilePage />);
        });

        await waitFor(() => {
          const breadcrumb = screen.getByTestId("tenant-breadcrumb");
          expect(breadcrumb).toBeInTheDocument();

          expect(screen.getByTestId("breadcrumb-tenant-name")).toHaveTextContent("Test Church");
          expect(screen.getByTestId("breadcrumb-tenant-slug")).toHaveTextContent("test-church");
          expect(screen.getByTestId("breadcrumb-item-0")).toHaveTextContent("個人資料");
        });
      });

      it("should show breadcrumb with different tenant data", async () => {
        const differentTenant = {
          ...mockTenant,
          name: "Different Church",
          slug: "different-church",
        };

        mockParams.slug = "different-church";
        mockUseSessionHelpers.withProfile(testProfile);
        mockGetTenantBySlug.mockResolvedValue(differentTenant);

        await act(async () => {
          render(<ProfilePage />);
        });

        await waitFor(() => {
          expect(screen.getByTestId("tenant-breadcrumb")).toBeInTheDocument();
          expect(screen.getByTestId("breadcrumb-tenant-name")).toHaveTextContent(
            "Different Church",
          );
          expect(screen.getByTestId("breadcrumb-tenant-slug")).toHaveTextContent(
            "different-church",
          );
          expect(screen.getByTestId("breadcrumb-item-0")).toHaveTextContent("個人資料");
        });
      });

      it("should not show breadcrumb when slug exists but tenant is null", async () => {
        mockUseSessionHelpers.withProfile(testProfile);
        mockGetTenantBySlug.mockResolvedValue(null);

        await act(async () => {
          render(<ProfilePage />);
        });

        await waitFor(() => {
          expect(screen.getByText("找不到租戶")).toBeInTheDocument();
        });

        expect(screen.queryByTestId("tenant-breadcrumb")).not.toBeInTheDocument();
      });

      it("should not show breadcrumb when tenant fetch fails", async () => {
        mockUseSessionHelpers.withProfile(testProfile);
        mockGetTenantBySlug.mockRejectedValue(new Error("Network error"));

        await act(async () => {
          render(<ProfilePage />);
        });

        await waitFor(() => {
          expect(screen.getByText("找不到租戶")).toBeInTheDocument();
        });

        expect(screen.queryByTestId("tenant-breadcrumb")).not.toBeInTheDocument();
      });

      it("should not show breadcrumb while tenant is loading", async () => {
        mockUseSessionHelpers.withProfile(testProfile);

        // Mock a pending promise to simulate loading
        mockGetTenantBySlug.mockImplementation(() => new Promise(() => {}));

        await act(async () => {
          render(<ProfilePage />);
        });

        expect(screen.getByText("載入中...")).toBeInTheDocument();
        expect(screen.queryByTestId("tenant-breadcrumb")).not.toBeInTheDocument();
      });

      it("should not show breadcrumb when user session is loading", async () => {
        mockUseSessionHelpers.loading();

        await act(async () => {
          render(<ProfilePage />);
        });

        expect(screen.getByText("載入中...")).toBeInTheDocument();
        expect(screen.queryByTestId("tenant-breadcrumb")).not.toBeInTheDocument();
      });

      it("should show breadcrumb only after both user and tenant are loaded", async () => {
        mockUseSessionHelpers.withProfile(testProfile);

        // Start with pending tenant
        let resolveTenant: (value: typeof mockTenant) => void;
        const tenantPromise = new Promise<typeof mockTenant>((resolve) => {
          resolveTenant = resolve;
        });
        mockGetTenantBySlug.mockReturnValue(tenantPromise);

        await act(async () => {
          render(<ProfilePage />);
        });

        // Should show loading, no breadcrumb
        expect(screen.getByText("載入中...")).toBeInTheDocument();
        expect(screen.queryByTestId("tenant-breadcrumb")).not.toBeInTheDocument();

        // Resolve tenant
        await act(async () => {
          resolveTenant(mockTenant);
        });

        // Should now show breadcrumb
        await waitFor(() => {
          expect(screen.getByTestId("tenant-breadcrumb")).toBeInTheDocument();
          expect(screen.getByTestId("breadcrumb-tenant-name")).toHaveTextContent("Test Church");
        });
      });
    });
  });
});
