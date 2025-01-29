import C from "constants/constants.json";
import { post } from "./utils";

export async function dbNewVersionFilename(filenameGlob) {
  return await post({
    body: { filenameGlob },
    address: C.ROUTE_NEW_JSON_VERSION_NAME,
  });
}
