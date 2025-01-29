import C from "constants/constants.json";
import { post } from "./utils";

export async function dbLoadArtifacts(artifactIds) {
  return await post({
    body: { artifactIds },
    address: C.ROUTE_LOAD_ARTIFACTS,
  });
}

export async function dbLoadAvailableArtifacts(sectionType) {
  return await post({
    body: { sectionType },
    address: C.ROUTE_LOAD_AVAILABLE_ARTIFACTS,
  });
}

export async function dbCheckIfFileExists(filepath) {
  return await post({
    body: { filepath },
    address: C.ROUTE_CHECK_IF_FILE_EXISTS,
  });
}

export async function dbLoadArtifactFromDisk(filepath, type) {
  return await post({
    body: { filepath, type },
    address: C.ROUTE_LOAD_ARTIFACT_FROM_DISK,
  });
}

export async function dbReadCSVBase64(base64Str) {
  return await post({
    body: { base64Str },
    address: C.ROUTE_READ_CSV_BASE64,
  });
}

export async function dbGetArtifactIdsFromNamePathType(namesPathsTypes) {
  return await post({
    body: { namesPathsTypes },
    address: C.ROUTE_GET_ARTIFACT_IDS_FROM_NAME_PATH_TYPE,
  });
}
