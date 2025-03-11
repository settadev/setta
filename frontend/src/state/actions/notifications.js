import { useNotifications } from "state/definitions";

// Standalone notification actions as separate functions
export const addNotification = (notification) => {
  useNotifications.setState((state) => ({
    notifications: [notification, ...state.notifications],
  }));
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

export const addTemporaryNotification = (
  message,
  type = "info",
  timeout = 3000,
) => {
  const id = `temp-${Date.now()}`;
  const notification = {
    id,
    timestamp: new Date().toISOString(),
    type,
    message,
    read_status: false,
    temporary: true,
    source: "frontend",
  };

  useNotifications.setState((state) => ({
    notifications: [notification, ...state.notifications],
  }));

  // Auto-remove after timeout
  setTimeout(() => {
    useNotifications.setState((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  }, timeout);

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
