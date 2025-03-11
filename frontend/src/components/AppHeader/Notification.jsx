import { getNotificationIcon } from "components/Panes/Overview/NotificationsArea";
import { useNotifications } from "state/definitions";

export function Notification() {
  // Get the most recent notification from the state
  const latestNotification = useNotifications((state) =>
    state.notifications.length > 0 ? state.notifications[0] : null,
  );

  // If there's no notification, don't render anything
  if (!latestNotification) {
    return null;
  }

  const { message, type } = latestNotification;

  return (
    <div className="flex items-center gap-0.5 transition-all">
      {getNotificationIcon(type)}
      <p className="ml-2 hidden self-center text-xs text-setta-500 dark:text-setta-100 md:inline-block">
        {message}
      </p>
    </div>
  );
}
