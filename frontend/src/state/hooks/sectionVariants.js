import _ from "lodash";
import {
  getDisplayedSectionVariant,
  getSectionVariant,
} from "state/actions/sectionInfos";
import { useSectionInfos } from "state/definitions";
import { newEVEntry } from "utils/objs/ev";

export function useGetParamEnteredValueAndEVRefs(sectionId, paramInfoId) {
  return useSectionInfos((x) => {
    const vals = getDisplayedSectionVariant(sectionId, x).values;
    if (paramInfoId in vals) {
      return {
        value: vals[paramInfoId].value,
        evRefs: vals[paramInfoId].evRefs,
      };
    }
    return newEVEntry();
  }, _.isEqual);
}

export function useGetSectionVariantNames(sectionId) {
  return useSectionInfos(
    (x) =>
      sectionId
        ? x.x[sectionId].variantIds.map((e) => ({
            id: e,
            name: x.variants[e].name,
          }))
        : [],
    _.isEqual,
  );
}

export function useListElementIdx(sectionId) {
  return useSectionInfos((x) => {
    const parentId = x.x[sectionId].parentId;
    return getDisplayedSectionVariant(parentId).children.indexOf(sectionId);
  });
}

export function useSectionVariantIsFrozen(sectionId) {
  return useSectionInfos((x) => getSectionVariant(sectionId, x).isFrozen);
}

export function useTextBlockDescriptionAndEditability(sectionId) {
  return useSectionInfos((x) => {
    return {
      ...getTextBlockDescription(sectionId, x),
      variantIsFrozen: getSectionVariant(sectionId, x).isFrozen,
    };
  }, _.isEqual);
}

export function getTextBlockDescription(sectionId, state) {
  return {
    renderMarkdown: state.x[sectionId].renderMarkdown,
    description: getDisplayedSectionVariant(sectionId, state).description,
  };
}
