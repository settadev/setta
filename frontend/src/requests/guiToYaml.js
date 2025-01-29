import C from "constants/constants.json";
import {
  getCodeChildrenAndParentCodeInfoId,
  getDisplayedCodeInfoCol,
  getSectionType,
} from "state/actions/sectionInfos";
import { getParamIdsToShowInArea } from "state/actions/sections/sectionContents";
import { useSectionInfos } from "state/definitions";
import { getForSectionId } from "state/hooks/paramSweep";
import { newCodeInfoCol } from "utils/objs/codeInfoCol";
import { post } from "./utils";

export async function dbGuiToYaml(sectionId, variantId) {
  const sectionType = getSectionType(sectionId);
  switch (sectionType) {
    case C.PARAM_SWEEP:
      return await dbParamSweepSectionToYaml(sectionId, variantId);
    case C.GLOBAL_PARAM_SWEEP:
      return await dbGlobalParamSweepSectionToYaml(variantId);
    case C.GLOBAL_VARIABLES:
    case C.SECTION:
      return await dbSectionToYaml(variantId);
  }
}

async function dbSectionToYaml(variantId) {
  const state = useSectionInfos.getState();
  const { codeInfoChildren, parentCodeInfoId } =
    getCodeChildrenAndParentCodeInfoId(null, state, variantId);
  const codeInfo = state.codeInfo;
  const pinnedIds = getParamIdsToShowInArea(
    true,
    codeInfo,
    codeInfoChildren,
    parentCodeInfoId,
  );
  const unpinnedIds = getParamIdsToShowInArea(
    false,
    codeInfo,
    codeInfoChildren,
    parentCodeInfoId,
  );
  pinnedIds.requiredParamIds = Object.keys(pinnedIds.requiredParamIdsToPaths);
  unpinnedIds.requiredParamIds = Object.keys(
    unpinnedIds.requiredParamIdsToPaths,
  );
  delete pinnedIds.requiredParamIdsToPaths;
  delete unpinnedIds.requiredParamIdsToPaths;
  const sectionVariant = state.variants[variantId];
  const res = await post({
    body: {
      codeInfo,
      codeInfoChildren,
      sectionVariant,
      pinnedIds,
      unpinnedIds,
    },
    address: C.ROUTE_SECTION_TO_YAML,
  });
  return res;
}

async function dbParamSweepSectionToYaml(sectionId, variantId) {
  const state = useSectionInfos.getState();
  const forSectionId = getForSectionId(sectionId, state.x);
  const sectionVariant = state.variants[variantId];
  const sweep = sectionVariant.sweep;
  const codeInfo = state.codeInfo;
  const codeInfoCol =
    getDisplayedCodeInfoCol(forSectionId, state) ?? newCodeInfoCol();
  const codeInfoChildren = codeInfoCol.children;

  const res = await post({
    body: {
      sweep,
      codeInfo,
      codeInfoChildren,
    },
    address: C.ROUTE_PARAM_SWEEP_SECTION_TO_YAML,
  });
  return res;
}

async function dbGlobalParamSweepSectionToYaml(variantId) {
  const state = useSectionInfos.getState();
  const sections = state.x;
  const sectionVariants = state.variants;
  const runGroup = sectionVariants[variantId].runGroup;

  const res = await post({
    body: {
      runGroup,
      sections,
      sectionVariants,
    },
    address: C.ROUTE_GLOBAL_PARAM_SWEEP_SECTION_TO_YAML,
  });
  return res;
}
