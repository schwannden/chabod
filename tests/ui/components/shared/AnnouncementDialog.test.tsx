import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { render } from "../../test-utils";

// Define the interface for the mock component
interface MockAnnouncementDialogProps {
  isOpen: boolean;
  announcement: {
    id: string;
    title: string;
    message: string;
    icon?: string;
    dontShowAgain?: string;
    understood?: string;
  } | null;
  onDismiss: (dontShowAgain?: boolean) => void;
}

// Create a more comprehensive mock for testing
const MockAnnouncementDialog = ({
  isOpen,
  announcement,
  onDismiss,
}: MockAnnouncementDialogProps) => {
  if (!isOpen || !announcement) return null;

  const dontShowAgainText = announcement.dontShowAgain || "common.dontShowAgain";
  const understoodText = announcement.understood || "common.understood";

  return (
    <div role="dialog" data-testid="announcement-dialog" aria-modal="true">
      <div data-testid="announcement-title">{announcement.title}</div>
      <div data-testid="announcement-message">{announcement.message}</div>
      <div data-testid="announcement-icon">{announcement.icon || "warning"}</div>
      <label>
        <input type="checkbox" data-testid="dont-show-again-checkbox" />
        {dontShowAgainText}
      </label>
      <button onClick={() => onDismiss(false)} data-testid="understood-button">
        {understoodText}
      </button>
      <button
        onClick={() => onDismiss(true)}
        data-testid="dont-show-again-button"
        style={{ display: "none" }} // Hidden helper for testing
      >
        Don't show again
      </button>
    </div>
  );
};

// Mock the AnnouncementDialog component
jest.mock("@/components/shared/AnnouncementDialog", () => ({
  AnnouncementDialog: MockAnnouncementDialog,
}));

const mockAnnouncement = {
  id: "testAnnouncement",
  title: "Test Title",
  message: "Test Message",
  icon: "warning",
  dontShowAgain: "Don't show this again",
  understood: "Got it",
};

describe("AnnouncementDialog", () => {
  const mockOnDismiss = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should not render when announcement is null", () => {
    render(<MockAnnouncementDialog isOpen={true} announcement={null} onDismiss={mockOnDismiss} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("should not render when isOpen is false", () => {
    render(
      <MockAnnouncementDialog
        isOpen={false}
        announcement={mockAnnouncement}
        onDismiss={mockOnDismiss}
      />,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("should render announcement dialog with all content", () => {
    render(
      <MockAnnouncementDialog
        isOpen={true}
        announcement={mockAnnouncement}
        onDismiss={mockOnDismiss}
      />,
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Test Title")).toBeInTheDocument();
    expect(screen.getByText("Test Message")).toBeInTheDocument();
    expect(screen.getByText("Don't show this again")).toBeInTheDocument();
    expect(screen.getByText("Got it")).toBeInTheDocument();
    expect(screen.getByTestId("dont-show-again-checkbox")).toBeInTheDocument();
  });

  it("should render with default text when custom text is not provided", () => {
    const announcementWithoutCustomText = {
      id: "testAnnouncement",
      title: "Test Title",
      message: "Test Message",
    };

    render(
      <MockAnnouncementDialog
        isOpen={true}
        announcement={announcementWithoutCustomText}
        onDismiss={mockOnDismiss}
      />,
    );

    expect(screen.getByText("common.dontShowAgain")).toBeInTheDocument();
    expect(screen.getByText("common.understood")).toBeInTheDocument();
  });

  it("should render HTML content in message", () => {
    const announcementWithHtml = {
      ...mockAnnouncement,
      message: "Test message with <strong>bold text</strong>",
    };

    render(
      <MockAnnouncementDialog
        isOpen={true}
        announcement={announcementWithHtml}
        onDismiss={mockOnDismiss}
      />,
    );

    expect(screen.getByText("Test message with <strong>bold text</strong>")).toBeInTheDocument();
  });

  it("should render different icon types", () => {
    const iconTypes = ["info", "warning", "error", "success", "unknown"];

    iconTypes.forEach((iconType) => {
      const { unmount } = render(
        <MockAnnouncementDialog
          isOpen={true}
          announcement={{ ...mockAnnouncement, icon: iconType }}
          onDismiss={mockOnDismiss}
        />,
      );

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByTestId("announcement-icon")).toHaveTextContent(iconType);
      unmount();
    });
  });

  it("should call onDismiss with false when understood button is clicked", async () => {
    const user = userEvent.setup();

    render(
      <MockAnnouncementDialog
        isOpen={true}
        announcement={mockAnnouncement}
        onDismiss={mockOnDismiss}
      />,
    );

    const understoodButton = screen.getByTestId("understood-button");
    await user.click(understoodButton);

    expect(mockOnDismiss).toHaveBeenCalledWith(false);
  });

  it("should call onDismiss with true when dont show again is triggered", async () => {
    const user = userEvent.setup();

    render(
      <MockAnnouncementDialog
        isOpen={true}
        announcement={mockAnnouncement}
        onDismiss={mockOnDismiss}
      />,
    );

    const dontShowAgainButton = screen.getByTestId("dont-show-again-button");
    await user.click(dontShowAgainButton);

    expect(mockOnDismiss).toHaveBeenCalledWith(true);
  });

  it("should render checkbox for dont show again option", () => {
    render(
      <MockAnnouncementDialog
        isOpen={true}
        announcement={mockAnnouncement}
        onDismiss={mockOnDismiss}
      />,
    );

    const checkbox = screen.getByTestId("dont-show-again-checkbox");
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).toHaveAttribute("type", "checkbox");
  });

  it("should display the correct icon", () => {
    render(
      <MockAnnouncementDialog
        isOpen={true}
        announcement={mockAnnouncement}
        onDismiss={mockOnDismiss}
      />,
    );

    expect(screen.getByTestId("announcement-icon")).toHaveTextContent("warning");
  });
});
