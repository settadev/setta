import C from "constants/constants.json";
import { setNotificationMessage } from "state/actions/notification";
import { post } from "./utils";

export async function dbRestartLanguageServer() {
  setNotificationMessage("Restarting Language Server");
  return await post({ body: {}, address: C.ROUTE_RESTART_LANGUAGE_SERVER });
}
