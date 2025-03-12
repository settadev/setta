import C from "constants/constants.json";
import _ from "lodash";
import { useEffect } from "react";
import {
  IoAlertCircleSharp,
  IoCheckmarkCircle,
  IoClose,
  IoInformationCircle,
  IoWarning,
} from "react-icons/io5";
import { VscSave } from "react-icons/vsc";
import { dbGetNotifications } from "requests/notifications";
import {
  markAsRead,
  removeNotification,
  setNotifications,
} from "state/actions/notifications"; // Assuming this import path
import { useNotifications, useSectionInfos } from "state/definitions";

export function NotificationsArea() {
  // Get all non-temporary notifications from the store
  const notifications = useNotifications(
    (state) => state.notifications.filter((n) => !n.temporary),
    _.isEqual,
  );

  const projectConfigId = useSectionInfos((x) => x.projectConfig.id);

  // Fetch notifications when component mounts
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await dbGetNotifications(projectConfigId);
        if (response.status === 200 && response.data) {
          // Set the notifications in the store
          setNotifications(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      }
    };

    fetchNotifications();
  }, [projectConfigId]);

  return (
    <div className="flex w-full flex-col gap-4 overflow-y-auto">
      {notifications.length > 0 ? (
        notifications.map((notification) => (
          <NotificationItem key={notification.id} notification={notification} />
        ))
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-setta-400 dark:text-setta-500">
          <IoInformationCircle size={24} />
          <p className="mt-2 text-sm">No notifications yet</p>
        </div>
      )}
    </div>
  );
}
function NotificationItem({ notification }) {
  const { id, type, message, timestamp, read_status } = notification;

  // Format timestamp for display
  const formattedTime = new Date(timestamp).toLocaleString();

  // Handle removing a notification
  const handleRemove = () => {
    removeNotification(id);
  };

  // Handle marking a notification as read when interacted with
  const handleMarkAsRead = () => {
    if (!read_status) {
      markAsRead(id);
    }
  };

  return (
    <section
      className={`group/notifications overflow-clip rounded-md px-3 py-2 transition-all hover:bg-white hover:shadow-md hover:dark:bg-setta-800 hover:dark:shadow-lg ${!read_status ? "bg-blue-50 dark:bg-setta-900/50" : ""}`}
      onClick={handleMarkAsRead}
    >
      <header className="mb-2 flex items-center justify-between gap-2">
        <i>{getNotificationIcon(type, "h-4 w-4")}</i>
        <h3 className="truncate font-semibold tracking-tight text-setta-600 group-hover/notifications:text-setta-900 dark:text-setta-300 group-hover/notifications:dark:text-setta-100">
          {message}
        </h3>
        <button
          className="cursor-pointer text-setta-500 hover:text-blue-600"
          onClick={(e) => {
            e.stopPropagation();
            handleRemove();
          }}
        >
          <IoClose size={15} />
        </button>
      </header>

      <div className="flex items-center justify-between">
        <p className="text-xs text-setta-600 group-hover/notifications:text-setta-900 dark:text-setta-100 group-hover/notifications:dark:text-white">
          {notification.metadata && notification.metadata.details
            ? notification.metadata.details
            : ""}
        </p>
        <span className="text-xs text-setta-400 dark:text-setta-500">
          {formattedTime}
        </span>
      </div>
    </section>
  );
}

export function getNotificationIcon(type, className = "") {
  switch (type) {
    case C.NOTIFICATION_TYPE_SUCCESS:
      return (
        <IoCheckmarkCircle
          className={`${className} text-green-500 dark:text-green-400`}
        />
      );
    case C.NOTIFICATION_TYPE_ERROR:
      return (
        <IoAlertCircleSharp
          className={`${className} text-red-500 dark:text-red-400`}
        />
      );
    case C.NOTIFICATION_TYPE_WARNING:
      return (
        <IoWarning
          className={`${className} text-yellow-500 dark:text-yellow-400`}
        />
      );
    case C.NOTIFICATION_TYPE_SAVE:
      return (
        <VscSave className={`${className} text-setta-400 dark:text-setta-50`} />
      );
    case C.NOTIFICATION_TYPE_INFO:
    default:
      return (
        <IoInformationCircle
          className={`${className} text-blue-500 dark:text-blue-400`}
        />
      );
  }
}
