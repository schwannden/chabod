import { screen } from "@testing-library/react";
import { render, mockUseSessionHelpers } from "../test-utils";
import LandingPage from "@/pages/LandingPage";

// Mock all the Landing page components
jest.mock("@/components/Layout/NavBar", () => ({
  NavBar: () => <nav data-testid="navbar">Navigation Bar</nav>,
}));

jest.mock("@/components/Landing/Hero", () => ({
  Hero: () => <section data-testid="hero">Hero Section</section>,
}));

jest.mock("@/components/Landing/Features", () => ({
  Features: () => <section data-testid="features">Features Section</section>,
}));

jest.mock("@/components/Landing/ValueProposition", () => ({
  ValueProposition: () => (
    <section data-testid="value-proposition">Value Proposition Section</section>
  ),
}));

jest.mock("@/components/Landing/PricingPlans", () => ({
  PricingPlans: () => <section data-testid="pricing-plans">Pricing Plans Section</section>,
}));

jest.mock("@/components/Landing/CallToAction", () => ({
  CallToAction: () => <section data-testid="call-to-action">Call To Action Section</section>,
}));

jest.mock("@/components/Landing/Footer", () => ({
  Footer: () => <footer data-testid="footer">Footer Section</footer>,
}));

describe("LandingPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render with proper page structure", () => {
      // Landing page doesn't require authentication
      mockUseSessionHelpers.unauthenticated();

      render(<LandingPage />);

      // Check main page structure
      const pageContainer = screen.getByRole("main").parentElement;
      expect(pageContainer).toHaveClass("min-h-screen", "bg-background", "flex", "flex-col");

      // Check main content area
      const mainElement = screen.getByRole("main");
      expect(mainElement).toHaveClass("flex-1");
    });

    it("should render all required sections in correct order", () => {
      mockUseSessionHelpers.unauthenticated();

      render(<LandingPage />);

      // Check that all sections are rendered
      expect(screen.getByTestId("navbar")).toBeInTheDocument();
      expect(screen.getByTestId("hero")).toBeInTheDocument();
      expect(screen.getByTestId("features")).toBeInTheDocument();
      expect(screen.getByTestId("value-proposition")).toBeInTheDocument();
      expect(screen.getByTestId("pricing-plans")).toBeInTheDocument();
      expect(screen.getByTestId("call-to-action")).toBeInTheDocument();
      expect(screen.getByTestId("footer")).toBeInTheDocument();
    });

    it("should render NavBar outside main content", () => {
      mockUseSessionHelpers.unauthenticated();

      render(<LandingPage />);

      const navbar = screen.getByTestId("navbar");
      const mainElement = screen.getByRole("main");

      // NavBar should be outside main content
      expect(mainElement).not.toContainElement(navbar);
    });

    it("should render Footer outside main content", () => {
      mockUseSessionHelpers.unauthenticated();

      render(<LandingPage />);

      const footer = screen.getByTestId("footer");
      const mainElement = screen.getByRole("main");

      // Footer should be outside main content
      expect(mainElement).not.toContainElement(footer);
    });

    it("should render all main sections inside main content", () => {
      mockUseSessionHelpers.unauthenticated();

      render(<LandingPage />);

      const mainElement = screen.getByRole("main");

      // All main sections should be inside main content
      expect(mainElement).toContainElement(screen.getByTestId("hero"));
      expect(mainElement).toContainElement(screen.getByTestId("features"));
      expect(mainElement).toContainElement(screen.getByTestId("value-proposition"));
      expect(mainElement).toContainElement(screen.getByTestId("pricing-plans"));
      expect(mainElement).toContainElement(screen.getByTestId("call-to-action"));
    });
  });

  describe("Authentication State Handling", () => {
    it("should render correctly when user is loading", () => {
      mockUseSessionHelpers.loading();

      render(<LandingPage />);

      // Should still render all sections even during loading
      expect(screen.getByTestId("navbar")).toBeInTheDocument();
      expect(screen.getByTestId("hero")).toBeInTheDocument();
      expect(screen.getByTestId("features")).toBeInTheDocument();
      expect(screen.getByTestId("value-proposition")).toBeInTheDocument();
      expect(screen.getByTestId("pricing-plans")).toBeInTheDocument();
      expect(screen.getByTestId("call-to-action")).toBeInTheDocument();
      expect(screen.getByTestId("footer")).toBeInTheDocument();
    });

    it("should render correctly when user is authenticated", () => {
      mockUseSessionHelpers.authenticated();

      render(<LandingPage />);

      // Should render all sections regardless of auth state
      expect(screen.getByTestId("navbar")).toBeInTheDocument();
      expect(screen.getByTestId("hero")).toBeInTheDocument();
      expect(screen.getByTestId("features")).toBeInTheDocument();
      expect(screen.getByTestId("value-proposition")).toBeInTheDocument();
      expect(screen.getByTestId("pricing-plans")).toBeInTheDocument();
      expect(screen.getByTestId("call-to-action")).toBeInTheDocument();
      expect(screen.getByTestId("footer")).toBeInTheDocument();
    });

    it("should render correctly when user is unauthenticated", () => {
      mockUseSessionHelpers.unauthenticated();

      render(<LandingPage />);

      // Should render all sections for unauthenticated users
      expect(screen.getByTestId("navbar")).toBeInTheDocument();
      expect(screen.getByTestId("hero")).toBeInTheDocument();
      expect(screen.getByTestId("features")).toBeInTheDocument();
      expect(screen.getByTestId("value-proposition")).toBeInTheDocument();
      expect(screen.getByTestId("pricing-plans")).toBeInTheDocument();
      expect(screen.getByTestId("call-to-action")).toBeInTheDocument();
      expect(screen.getByTestId("footer")).toBeInTheDocument();
    });
  });

  describe("Layout Structure", () => {
    it("should have proper semantic HTML structure", () => {
      mockUseSessionHelpers.unauthenticated();

      render(<LandingPage />);

      // Check for semantic HTML elements
      expect(screen.getByRole("navigation")).toBeInTheDocument(); // nav element
      expect(screen.getByRole("main")).toBeInTheDocument(); // main element
      expect(screen.getByRole("contentinfo")).toBeInTheDocument(); // footer element
    });

    it("should maintain proper document structure", () => {
      mockUseSessionHelpers.unauthenticated();

      render(<LandingPage />);

      // Check that sections are properly structured using test-ids
      const sections = [
        screen.getByTestId("hero"),
        screen.getByTestId("features"),
        screen.getByTestId("value-proposition"),
        screen.getByTestId("pricing-plans"),
        screen.getByTestId("call-to-action"),
      ];
      expect(sections).toHaveLength(5);

      // Check that main element contains the sections
      const mainElement = screen.getByRole("main");
      sections.forEach((section) => {
        expect(mainElement).toContainElement(section);
      });
    });
  });

  describe("Error Handling", () => {
    it("should not throw errors during rendering", () => {
      mockUseSessionHelpers.unauthenticated();

      expect(() => {
        render(<LandingPage />);
      }).not.toThrow();
    });

    it("should handle session state changes gracefully", () => {
      mockUseSessionHelpers.unauthenticated();

      const { rerender } = render(<LandingPage />);

      expect(() => {
        mockUseSessionHelpers.authenticated();
        rerender(<LandingPage />);
      }).not.toThrow();

      expect(() => {
        mockUseSessionHelpers.loading();
        rerender(<LandingPage />);
      }).not.toThrow();
    });
  });
});
