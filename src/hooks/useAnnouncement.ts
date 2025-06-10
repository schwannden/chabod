import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";

const ANNOUNCEMENT_PREFIX = "announcements";
const STORAGE_PREFIX = "chabod-announcement-dismissed";
const EXPIRATION_DAYS = 60;

interface Announcement {
  id: string;
  title: string;
  message: string;
  icon?: string;
  dontShowAgain?: string;
  understood?: string;
}

interface AnnouncementDismissal {
  dismissed: boolean;
  timestamp: number;
}

export function useAnnouncement() {
  const [currentAnnouncement, setCurrentAnnouncement] = useState<Announcement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const { ready, i18n } = useTranslation();

  // Function to check if a dismissal is still valid (not expired)
  const isDismissalValid = (dismissal: AnnouncementDismissal): boolean => {
    const now = Date.now();
    const expirationTime = dismissal.timestamp + EXPIRATION_DAYS * 24 * 60 * 60 * 1000;
    return now < expirationTime;
  };

  // Function to get storage key for an announcement
  const getStorageKey = (announcementId: string): string => {
    return `${STORAGE_PREFIX}-${announcementId}`;
  };

  // Function to scan i18n for announcements
  const scanAnnouncements = useCallback((): Announcement[] => {
    if (!ready) return [];

    try {
      // Get current language resources
      const store = i18n.getResourceBundle(i18n.language, "translation");

      if (!store || !store[ANNOUNCEMENT_PREFIX]) {
        return [];
      }

      const announcements: Announcement[] = [];
      const announcementKeys = store[ANNOUNCEMENT_PREFIX];

      // Scan for announcement objects
      Object.keys(announcementKeys).forEach((key) => {
        const announcement = announcementKeys[key];

        // Check if this is a valid announcement object with required fields
        if (typeof announcement === "object" && announcement.title && announcement.message) {
          announcements.push({
            id: key,
            title: announcement.title,
            message: announcement.message,
            icon: announcement.icon,
            dontShowAgain: announcement.dontShowAgain,
            understood: announcement.understood,
          });
        }
      });

      return announcements;
    } catch (error) {
      console.error("Error scanning announcements:", error);
      return [];
    }
  }, [ready, i18n]);

  // Function to find the next announcement to show
  const findNextAnnouncement = useCallback((): Announcement | null => {
    const announcements = scanAnnouncements();

    for (const announcement of announcements) {
      const storageKey = getStorageKey(announcement.id);
      const dismissalData = localStorage.getItem(storageKey);

      if (!dismissalData) {
        // Not dismissed, show this announcement
        return announcement;
      }

      try {
        const dismissal: AnnouncementDismissal = JSON.parse(dismissalData);
        if (!isDismissalValid(dismissal)) {
          // Dismissal expired, remove it and show this announcement
          localStorage.removeItem(storageKey);
          return announcement;
        }
      } catch (error) {
        // Invalid dismissal data, remove it and show this announcement
        console.error("Error parsing dismissal data:", error);
        localStorage.removeItem(storageKey);
        return announcement;
      }
    }

    return null;
  }, [scanAnnouncements]);

  // Initialize announcements when i18n is ready
  useEffect(() => {
    if (!ready) return;

    const nextAnnouncement = findNextAnnouncement();
    if (nextAnnouncement) {
      setCurrentAnnouncement(nextAnnouncement);
      setIsOpen(true);
    }
  }, [ready, findNextAnnouncement]);

  const dismissAnnouncement = (dontShowAgain: boolean = false) => {
    setIsOpen(false);

    if (dontShowAgain && currentAnnouncement) {
      const storageKey = getStorageKey(currentAnnouncement.id);
      const dismissalData: AnnouncementDismissal = {
        dismissed: true,
        timestamp: Date.now(),
      };
      localStorage.setItem(storageKey, JSON.stringify(dismissalData));
    }

    // Check for next announcement after a short delay
    setTimeout(() => {
      const nextAnnouncement = findNextAnnouncement();
      if (nextAnnouncement && nextAnnouncement.id !== currentAnnouncement?.id) {
        setCurrentAnnouncement(nextAnnouncement);
        setIsOpen(true);
      } else {
        setCurrentAnnouncement(null);
      }
    }, 100);
  };

  const resetAnnouncements = useCallback(() => {
    // Remove all announcement dismissals
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });

    // Re-check for announcements
    const nextAnnouncement = findNextAnnouncement();
    if (nextAnnouncement) {
      setCurrentAnnouncement(nextAnnouncement);
      setIsOpen(true);
    }
  }, [findNextAnnouncement]);

  return {
    isOpen,
    currentAnnouncement,
    dismissAnnouncement,
    resetAnnouncements,
  };
}
