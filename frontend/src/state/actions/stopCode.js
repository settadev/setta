import C from "constants/constants.json";
import { dbKillInMemorySubprocesses } from "requests/interactive";
import { addNotification, addTemporaryNotification } from "./notifications";

export async function stopCode() {
  addTemporaryNotification("Stopping subprocesses");

  try {
    const res = await dbKillInMemorySubprocesses();
    if (res.data.notification) {
      addNotification(res.data.notification);
    } else {
      addTemporaryNotification(
        "No subprocess to kill",
        C.NOTIFICATION_TYPE_INFO,
      );
    }
  } catch (error) {
    addTemporaryNotification(
      "Backend communication error",
      C.NOTIFICATION_TYPE_ERROR,
    );
  }
}
