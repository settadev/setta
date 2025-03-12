import { getNotificationIcon } from "components/Panes/Overview/NotificationsArea";
import { useEffect, useState } from "react";
import { useNotifications } from "state/definitions";

export function Notification() {
  // State to track the notification to display in the navbar
  const [displayNotification, setDisplayNotification] = useState(null);

  // Get the most recent notification from the store
  const latestNotification = useNotifications((state) =>
    state.notifications.length > 0 ? state.notifications[0] : null,
  );

  // Effect to handle new notifications
  useEffect(() => {
    // Only run if latestNotification exists and is different from what's displayed
    if (
      latestNotification &&
      (!displayNotification || latestNotification.id !== displayNotification.id)
    ) {
      // Update what's being displayed
      setDisplayNotification(latestNotification);

      // Use the notification's timeout if it exists, otherwise default to 5000ms
      const timeoutDuration = latestNotification.timeout || 3000;

      // Set a timeout to clear the display
      const timeoutId = setTimeout(() => {
        setDisplayNotification(null);
      }, timeoutDuration);

      return () => clearTimeout(timeoutId);
    }
  }, [latestNotification]); // Only depend on latestNotification

  // If there's no notification to display, don't render anything
  if (!displayNotification) {
    return null;
  }

  const { message, type } = displayNotification;

  return (
    <div className="flex items-center gap-0.5 transition-all">
      {getNotificationIcon(type, "ml-2 h-3 w-3 md:ml-4")}
      <p className="ml-2 hidden self-center text-xs text-setta-500 dark:text-setta-100 md:inline-block">
        {message}
      </p>
    </div>
  );
}
