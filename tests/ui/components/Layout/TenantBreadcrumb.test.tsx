import React from "react";
import { screen } from "@testing-library/react";
import { render } from "../../test-utils";
import { TenantBreadcrumb } from "@/components/Layout/TenantBreadcrumb";

// Mock shadcn breadcrumb components
jest.mock("@/components/ui/breadcrumb", () => ({
  Breadcrumb: ({ children }: { children: React.ReactNode }) => (
    <nav role="navigation">{children}</nav>
  ),
  BreadcrumbList: ({ children }: { children: React.ReactNode }) => <ol role="list">{children}</ol>,
  BreadcrumbItem: ({ children }: { children: React.ReactNode }) => <li>{children}</li>,
  BreadcrumbLink: ({ asChild, children }: { asChild?: boolean; children: React.ReactNode }) =>
    asChild ? <>{children}</> : <span>{children}</span>,
  BreadcrumbPage: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  BreadcrumbSeparator: () => <span>/</span>,
}));

describe("TenantBreadcrumb", () => {
  const defaultProps = {
    tenantName: "Test Church",
    tenantSlug: "test-church",
    items: [
      { label: "Dashboard", path: "/tenant/test-church/dashboard" },
      { label: "Members" }, // No path = current page
    ],
  };

  describe("Rendering", () => {
    it("should render tenant name as a link", () => {
      render(<TenantBreadcrumb {...defaultProps} />);

      const tenantLink = screen.getByRole("link", { name: "Test Church" });
      expect(tenantLink).toBeInTheDocument();
      expect(tenantLink).toHaveAttribute("href", "/tenant/test-church");
    });

    it("should render breadcrumb items correctly", () => {
      render(<TenantBreadcrumb {...defaultProps} />);

      // Should render tenant name link
      expect(screen.getByRole("link", { name: "Test Church" })).toBeInTheDocument();

      // Should render linked item
      const dashboardLink = screen.getByRole("link", { name: "Dashboard" });
      expect(dashboardLink).toBeInTheDocument();
      expect(dashboardLink).toHaveAttribute("href", "/tenant/test-church/dashboard");

      // Should render current page item (no link)
      expect(screen.getByText("Members")).toBeInTheDocument();
    });

    it("should render with single current page item", () => {
      const props = {
        tenantName: "Test Church",
        tenantSlug: "test-church",
        items: [{ label: "Profile" }],
      };

      render(<TenantBreadcrumb {...props} />);

      expect(screen.getByRole("link", { name: "Test Church" })).toBeInTheDocument();
      expect(screen.getByText("Profile")).toBeInTheDocument();

      // Profile should not be a link (current page)
      expect(screen.queryByRole("link", { name: "Profile" })).not.toBeInTheDocument();
    });

    it("should render with empty items array", () => {
      const props = {
        tenantName: "Test Church",
        tenantSlug: "test-church",
        items: [],
      };

      render(<TenantBreadcrumb {...props} />);

      expect(screen.getByRole("link", { name: "Test Church" })).toBeInTheDocument();
    });

    it("should render with multiple nested items", () => {
      const props = {
        tenantName: "Test Church",
        tenantSlug: "test-church",
        items: [
          { label: "Groups", path: "/tenant/test-church/groups" },
          { label: "Youth Group", path: "/tenant/test-church/groups/1" },
          { label: "Members" }, // Current page
        ],
      };

      render(<TenantBreadcrumb {...props} />);

      // Check all items are rendered
      expect(screen.getByRole("link", { name: "Test Church" })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Groups" })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Youth Group" })).toBeInTheDocument();
      expect(screen.getByText("Members")).toBeInTheDocument();

      // Check proper linking
      expect(screen.getByRole("link", { name: "Groups" })).toHaveAttribute(
        "href",
        "/tenant/test-church/groups",
      );
      expect(screen.getByRole("link", { name: "Youth Group" })).toHaveAttribute(
        "href",
        "/tenant/test-church/groups/1",
      );

      // Current page should not be a link
      expect(screen.queryByRole("link", { name: "Members" })).not.toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper breadcrumb navigation structure", () => {
      render(<TenantBreadcrumb {...defaultProps} />);

      // Should have breadcrumb navigation
      const nav = screen.getByRole("navigation");
      expect(nav).toBeInTheDocument();

      // Should have proper list structure
      const list = screen.getByRole("list");
      expect(list).toBeInTheDocument();
    });

    it("should have proper link accessibility", () => {
      render(<TenantBreadcrumb {...defaultProps} />);

      const tenantLink = screen.getByRole("link", { name: "Test Church" });
      const dashboardLink = screen.getByRole("link", { name: "Dashboard" });

      // Links should be focusable
      expect(tenantLink).not.toHaveAttribute("tabindex", "-1");
      expect(dashboardLink).not.toHaveAttribute("tabindex", "-1");
    });
  });

  describe("Edge Cases", () => {
    it("should handle special characters in tenant name", () => {
      const props = {
        tenantName: "St. Mary's & Joseph's Church",
        tenantSlug: "st-marys-josephs",
        items: [{ label: "Profile" }],
      };

      render(<TenantBreadcrumb {...props} />);

      expect(
        screen.getByRole("link", { name: "St. Mary's & Joseph's Church" }),
      ).toBeInTheDocument();
    });

    it("should handle special characters in item labels", () => {
      const props = {
        tenantName: "Test Church",
        tenantSlug: "test-church",
        items: [{ label: "Members & Groups" }],
      };

      render(<TenantBreadcrumb {...props} />);

      expect(screen.getByText("Members & Groups")).toBeInTheDocument();
    });

    it("should handle long tenant names gracefully", () => {
      const props = {
        tenantName: "The Very Long Name of Our Wonderful Community Church Organization",
        tenantSlug: "long-church-name",
        items: [{ label: "Profile" }],
      };

      render(<TenantBreadcrumb {...props} />);

      expect(
        screen.getByRole("link", {
          name: "The Very Long Name of Our Wonderful Community Church Organization",
        }),
      ).toBeInTheDocument();
    });
  });
});
