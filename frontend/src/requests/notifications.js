import C from "constants/constants.json";
import { post } from "./utils";

export async function dbGetNotifications(projectConfigId) {
  return await post({
    body: { projectConfigId },
    address: C.ROUTE_GET_NOTIFICATIONS,
  });
}
