import { dbKillInMemorySubprocesses } from "requests/interactive";
import { addTemporaryNotification } from "./notifications";

export async function stopCode() {
  addTemporaryNotification("Stopping subprocesses");
  const res = await dbKillInMemorySubprocesses();
  if (res.status === 200) {
    addTemporaryNotification("Subprocesses stopped!");
  }
}
