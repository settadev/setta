import C from "constants/constants.json";
import { useSectionInfos } from "state/definitions";
import { post } from "./utils";

export async function dbLoadSectionJSONSource(sectionId, jsonSource) {
  return await post({
    body: {
      project: dataForRequest(),
      sectionId,
      jsonSource,
    },
    address: C.ROUTE_LOAD_SECTION_JSON_SOURCE,
  });
}

export async function dbSaveSectionJSONSource(sectionId, oldVariantName) {
  return await post({
    body: {
      project: dataForRequest(),
      sectionId,
      forking_from: oldVariantName,
    },
    address: C.ROUTE_SAVE_SECTION_JSON_SOURCE,
  });
}

function dataForRequest() {
  const {
    x: sections,
    codeInfoCols,
    variants: sectionVariants,
    codeInfo,
  } = useSectionInfos.getState();
  return { sections, codeInfo, codeInfoCols, sectionVariants };
}

export async function dbGetJSONSourcePathToBeDeleted(variantName) {
  return await post({
    body: {
      variantName,
    },
    address: C.ROUTE_GET_JSON_SOURCE_PATH_TO_BE_DELETED,
  });
}

export async function dbDeleteFile(filepath) {
  return await post({
    body: {
      filepath,
    },
    address: C.ROUTE_DELETE_FILE,
  });
}
