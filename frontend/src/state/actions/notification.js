import { useNotification } from "state/definitions";

export function setNotificationMessage(payload) {
  useNotification.setState((state) => {
    // get rid of old setTimeout call
    if (state.timeoutId !== null) {
      clearTimeout(state.timeoutId);
    }
    const id = setTimeout(
      () => useNotification.setState({ message: "" }),
      3000,
    );
    return { message: payload, timeoutId: id };
  });
}
