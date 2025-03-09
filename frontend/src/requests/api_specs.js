import C from "constants/constants.json";
import { post } from "./utils";

export async function dbFetchAPISpecs(apiSpecsURL) {
  return await post({
    body: { apiSpecsURL },
    address: C.ROUTE_FETCH_API_SPECS,
  });
}
