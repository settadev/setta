import C from "constants/constants.json";
import { getSectionInfo } from "state/actions/sectionInfos";
import { post } from "./utils";

export async function dbFetchAPISpecs(apiSpecsURL) {
  return await post({
    body: { apiSpecsURL },
    address: C.ROUTE_FETCH_API_SPECS,
  });
}

export async function dbGetListOfEndpoints(sectionId) {
  const { apiSpecsURL } = getSectionInfo(sectionId);

  return await post({
    body: { apiSpecsURL },
    address: C.ROUTE_GET_LIST_OF_ENDPOINTS,
  });
}
