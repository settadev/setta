import C from "constants/constants.json";
import { useSectionInfos } from "state/definitions";
import { post } from "./utils";

export async function dbSetProjectConfigName(newProjectConfigName) {
  return await post({
    body: {
      currProjectConfigName: useSectionInfos.getState().projectConfig.name,
      newProjectConfigName,
    },
    address: C.ROUTE_SET_PROJECT_CONFIG_NAME,
  });
}
