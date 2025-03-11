import { IoAlertCircleSharp } from "react-icons/io5";
import { VscSave } from "react-icons/vsc";
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

  // Determine which icon to show based on notification type
  const getIcon = () => {
    if (message === "Saved!" || type === "success") {
      return (
        <VscSave className="ml-2 h-3 w-3 text-setta-400 dark:text-setta-50 md:ml-4" />
      );
    } else {
      return (
        <IoAlertCircleSharp className="ml-2 h-3 w-3 text-setta-400 dark:text-setta-50 md:ml-4" />
      );
    }
  };

  return (
    <div className="flex items-center gap-0.5 transition-all">
      {getIcon()}
      <p className="ml-2 hidden self-center text-xs text-setta-500 dark:text-setta-100 md:inline-block">
        {message}
      </p>
    </div>
  );
}
