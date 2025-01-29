import C from "constants/constants.json";
import _ from "lodash";
import {
  getDisplayedSectionVariantId,
  getSectionType,
  getSectionVariant,
} from "state/actions/sectionInfos";
import { useSectionInfos } from "state/definitions";
import { useGetSectionVariantNames } from "./sectionVariants";

export function useParamSweepInfo(sectionId) {
  return useSectionInfos((x) => {
    const displayedVariantId = getDisplayedSectionVariantId(sectionId, x);
    const forSectionId = getForSectionId(sectionId, x.x);
    return {
      forSectionId,
      variantId: displayedVariantId,
      paramSweep: x.variants[displayedVariantId].sweep,
      variantIsFrozen: getSectionVariant(sectionId).isFrozen,
      showParamSweepSectionSearch:
        !x.x[forSectionId].hideSearch &&
        getSectionType(forSectionId, x) !== C.GLOBAL_VARIABLES,
    };
  }, _.isEqual);
}

export function useGetParamSweepNames(sectionId) {
  const paramSweepSectionId = useSectionInfos(
    (x) => x.x[sectionId].paramSweepSectionId,
  );
  return useGetSectionVariantNames(paramSweepSectionId);
}

export function getForSectionId(sectionId, sectionState) {
  return Object.values(sectionState).find(
    (s) => s.paramSweepSectionId === sectionId,
  )?.id;
}
