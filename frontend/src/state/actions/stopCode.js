import { dbKillInMemorySubprocesses } from "requests/interactive";
import {
  addNotificationFromRes,
  addTemporaryNotification,
} from "./notifications";

export async function stopCode() {
  addTemporaryNotification("Stopping subprocesses");
  addNotificationFromRes(await dbKillInMemorySubprocesses());
}
