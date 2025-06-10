import "@testing-library/jest-dom";
import "./jest-dom.d.ts";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, jest } from "@jest/globals";
import React from "react";
import { TextEncoder, TextDecoder } from "util";

// Polyfill for TextEncoder/TextDecoder (required for React Router DOM 7)
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Configure React 18 test environment
global.IS_REACT_ACT_ENVIRONMENT = true;

// Suppress React 18 act warnings in test environment
const originalError = console.error;
beforeEach(() => {
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === "string" &&
      args[0].includes("Warning: An update to") &&
      args[0].includes("was not wrapped in act")
    ) {
      return;
    }
    if (
      typeof args[0] === "string" &&
      args[0].includes("The current testing environment is not configured to support act")
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterEach(() => {
  console.error = originalError;
});

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual<typeof import("react-router-dom")>("react-router-dom"),
  useNavigate: () => mockNavigate,
  useParams: () => ({}),
  useLocation: () => ({ pathname: "/" }),
}));

// Mock react-i18next with proper i18n object
const mockI18n = {
  language: "en",
  changeLanguage: jest.fn(),
  t: (key: string, params?: Record<string, unknown>) => {
    // Simple mock that returns the key, useful for testing
    if (params) {
      let result = key;
      Object.entries(params).forEach(([param, value]) => {
        result = result.replace(`{{${param}}}`, String(value));
      });
      return result;
    }
    return key;
  },
};

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: mockI18n.t,
    i18n: mockI18n,
  }),
  Trans: ({ children }: { children: React.ReactNode }) => children,
}));

// Do not mock clipboard globally - let userEvent handle it

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    getSession: jest.fn(),
    onAuthStateChange: jest.fn(() => ({
      data: { subscription: { unsubscribe: jest.fn() } },
    })),
    signOut: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
  })),
};

jest.mock("@/integrations/supabase/client", () => ({
  supabase: mockSupabaseClient,
}));

// Mock useSession hook
jest.mock("@/hooks/useSession", () => ({
  useSession: jest.fn(() => ({
    session: null,
    user: {
      id: "test-user-id",
      email: "test@example.com",
      aud: "authenticated",
      created_at: "2024-01-01T00:00:00Z",
      app_metadata: {},
      user_metadata: {},
      role: "authenticated",
      updated_at: "2024-01-01T00:00:00Z",
    },
    profile: null,
    isLoading: false,
    signOut: jest.fn(),
  })),
}));

// Mock LanguageSwitcher component
jest.mock("@/components/shared/LanguageSwitcher", () => ({
  LanguageSwitcher: () =>
    React.createElement("div", { "data-testid": "language-switcher" }, "Language Switcher"),
}));

// Mock other shared components
jest.mock("@/components/Tenants/TenantCreateDialog", () => ({
  TenantCreateDialog: ({ isOpen, children }: { isOpen: boolean; children?: React.ReactNode }) =>
    isOpen ? React.createElement("div", { "data-testid": "tenant-create-dialog" }, children) : null,
}));

jest.mock("@/components/Tenants/TenantUpdateDialog", () => ({
  TenantUpdateDialog: ({ isOpen, children }: { isOpen: boolean; children?: React.ReactNode }) =>
    isOpen ? React.createElement("div", { "data-testid": "tenant-update-dialog" }, children) : null,
}));

jest.mock("@/components/Tenants/PricePlansDialog", () => ({
  PricePlansDialog: ({ isOpen, children }: { isOpen: boolean; children?: React.ReactNode }) =>
    isOpen ? React.createElement("div", { "data-testid": "price-plans-dialog" }, children) : null,
}));

jest.mock("@/components/shared/HighRiskDeleteDialog", () => ({
  HighRiskDeleteDialog: ({ isOpen, children }: { isOpen: boolean; children?: React.ReactNode }) =>
    isOpen ? React.createElement("div", { "data-testid": "delete-dialog" }, children) : null,
}));

jest.mock("@/components/shared/AnnouncementDialog", () => ({
  AnnouncementDialog: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? React.createElement("div", { "data-testid": "announcement-dialog" }) : null,
}));

jest.mock("@/hooks/useAnnouncement", () => ({
  useAnnouncement: () => ({
    isOpen: false,
    currentAnnouncement: null,
    dismissAnnouncement: jest.fn(),
    resetAnnouncements: jest.fn(),
  }),
}));

// Mock Lucide React icons
jest.mock("lucide-react", () => ({
  Plus: () => React.createElement("svg", { "data-testid": "plus-icon" }),
  Settings: () => React.createElement("svg", { "data-testid": "settings-icon" }),
  Trash2: () => React.createElement("svg", { "data-testid": "trash-icon" }),
  Edit: () => React.createElement("svg", { "data-testid": "edit-icon" }),
  Pencil: () => React.createElement("svg", { "data-testid": "pencil-icon" }),
  Users: () => React.createElement("svg", { "data-testid": "users-icon" }),
  Calendar: () => React.createElement("svg", { "data-testid": "calendar-icon" }),
  Home: () => React.createElement("svg", { "data-testid": "home-icon" }),
  LogOut: () => React.createElement("svg", { "data-testid": "logout-icon" }),
  Copy: () => React.createElement("svg", { "data-testid": "copy-icon" }),
  Info: () => React.createElement("svg", { "data-testid": "info-icon" }),
  Loader2: () =>
    React.createElement("svg", { "data-testid": "loader-icon", className: "animate-spin" }),
  Globe: () => React.createElement("svg", { "data-testid": "globe-icon" }),
  User: () => React.createElement("svg", { "data-testid": "user-icon" }),
  Group: () => React.createElement("svg", { "data-testid": "group-icon" }),
  FileText: () => React.createElement("svg", { "data-testid": "file-text-icon" }),
  Handshake: () => React.createElement("svg", { "data-testid": "handshake-icon" }),
  UserPlus: () => React.createElement("svg", { "data-testid": "user-plus-icon" }),
  AlertTriangle: () => React.createElement("svg", { "data-testid": "alert-triangle-icon" }),
  AlertCircle: () => React.createElement("svg", { "data-testid": "alert-circle-icon" }),
  CheckCircle: () => React.createElement("svg", { "data-testid": "check-circle-icon" }),
  Check: () => React.createElement("svg", { "data-testid": "check-icon" }),
}));

// Mock next-themes
jest.mock("next-themes", () => ({
  useTheme: () => ({
    theme: "light",
    setTheme: jest.fn(),
  }),
}));

// Mock toast hook
jest.mock("@/components/ui/use-toast", () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

// Mock tenant utils
jest.mock("@/lib/tenant-utils", () => ({
  getTenants: jest.fn(),
  getTenantBySlug: jest.fn(),
  createTenant: jest.fn(),
  updateTenant: jest.fn(),
  deleteTenant: jest.fn(),
}));

// Mock member service
jest.mock("@/lib/member-service", () => ({
  checkUserTenantAccess: jest.fn(),
  inviteMemberToTenant: jest.fn(),
  inviteUserToTenant: jest.fn(),
  getTenantMembers: jest.fn(),
}));

// Mock tenant service
jest.mock("@/lib/tenant-service", () => ({
  getTenantBySlug: jest.fn(),
}));

// Cleanup after each test
afterEach(() => {
  cleanup();
  jest.clearAllMocks();
});
