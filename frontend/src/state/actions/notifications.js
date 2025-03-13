import C from "constants/constants.json";
import { useNotifications } from "state/definitions";
import { createNewId } from "utils/idNameCreation";

// Standalone notification actions as separate functions
export const addNotification = (notification) => {
  useNotifications.setState((state) => ({
    notifications: [notification, ...state.notifications],
  }));

  if (notification.temporary) {
    setTimeout(() => {
      useNotifications.setState((state) => ({
        notifications: state.notifications.filter(
          (n) => n.id !== notification.id,
        ),
      }));
    }, getTimeoutDuration(notification));
  }
};

export const markAsRead = (notificationId) => {
  useNotifications.setState((state) => ({
    notifications: state.notifications.map((n) =>
      n.id === notificationId ? { ...n, read_status: true } : n,
    ),
  }));
};

export const removeNotification = (notificationId) => {
  useNotifications.setState((state) => ({
    notifications: state.notifications.filter((n) => n.id !== notificationId),
  }));
};

export const setNotifications = (notifications) => {
  useNotifications.setState({ notifications });
};

export function addNotificationFromRes(res) {
  const notification = res.data;
  if (!notification.timestamp) {
    notification.timestamp = new Date().toISOString();
  }
  addNotification(notification);
}

export const addTemporaryNotification = (
  message,
  type = C.NOTIFICATION_TYPE_INFO,
  timeout = 3000,
) => {
  const id = createNewId();
  const notification = {
    id,
    timestamp: new Date().toISOString(),
    type,
    message,
    read_status: false,
    temporary: true,
    source: "frontend",
    timeout,
  };

  addNotification(notification);
  return id;
};

export const replaceTemporaryNotification = (tempId, permanentNotification) => {
  useNotifications.setState((state) => ({
    notifications: state.notifications.map((n) =>
      n.id === tempId
        ? { ...permanentNotification, id: permanentNotification.id || n.id }
        : n,
    ),
  }));
};

export const getTimeoutDuration = (notification) =>
  notification.timeout || 3000;
