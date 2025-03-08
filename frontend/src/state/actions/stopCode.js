import { dbKillInMemorySubprocesses } from "requests/interactive";
import { setNotificationMessage } from "./notification";

export async function stopCode() {
  setNotificationMessage("Stopping subprocesses");
  const res = await dbKillInMemorySubprocesses();
  if (res.status === 200) {
    setNotificationMessage("Subprocesses stopped!");
  }
}
