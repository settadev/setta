import C from "constants/constants.json";
import { getSectionInfo } from "state/actions/sectionInfos";
import { post } from "./utils";

// TODO: get rid of this
export const apiInfo = {};

export async function dbFetchAPISpecs(apiSpecsURL) {
  return await post({
    body: { apiSpecsURL },
    address: C.ROUTE_FETCH_API_SPECS,
  });
}

export async function dbGetListOfEndpoints(sectionId) {
  const { apiSpecsURL } = getSectionInfo(sectionId);

  const res = await post({
    body: { apiSpecsURL },
    address: C.ROUTE_GET_LIST_OF_ENDPOINTS,
  });

  if (res.data) {
    apiInfo[apiSpecsURL] = {};
    for (const e of res.data) {
      apiInfo[apiSpecsURL][e["label"]] = e["type"];
    }
  }

  return res;
}

export async function dbGetEndpointParameters(sectionId, endpoint) {
  const { apiSpecsURL } = getSectionInfo(sectionId);
  const method = apiInfo[apiSpecsURL][endpoint];

  return await post({
    body: { apiSpecsURL, endpoint, method },
    address: C.ROUTE_GET_ENDPOINT_PARAMETERS,
  });
}
