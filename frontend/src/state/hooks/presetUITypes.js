import C from "constants/constants.json";
import _ from "lodash";
import { isAmongNonPresets } from "state/actions/uiTypes/cloneUITypes";
import {
  isBasePreset,
  isPreset,
  isUserPreset,
  uiTypesToPretty,
} from "state/actions/uiTypes/utils";
import { useSectionInfos } from "state/definitions";
import { getUITypeColAttr } from "./uiTypes";

function createName(uiType) {
  const x = uiTypesToPretty[uiType.type];
  if (isUserPreset(uiType)) {
    return `${uiType.name} - (${x})`;
  }
  return x;
}

function filterUITypes(
  uiTypes,
  generalFilterFn,
  nonPresetFilterFn,
  selectedId,
) {
  const output = [];

  const nonPresets = _.filter(uiTypes, nonPresetFilterFn);

  for (const u of Object.values(uiTypes)) {
    // skip if it doesn't pass the general filter or it's not a preset
    if (!generalFilterFn(u) || !isPreset(u)) {
      continue;
    }

    // replace base presets with non-presets of the same type
    if (isBasePreset(u)) {
      // add base no matter what, if it's selected
      if (u.id === selectedId) {
        output.push(u);
      } else {
        // otherwise, maybe replace it with a non-preset
        const match = nonPresets.find((v) => v.type === u.type);
        output.push(match ?? u);
      }
    } else {
      output.push(u);
    }
  }

  return output.map((v) => ({
    id: v.id,
    name: createName(v),
    presetType: v.presetType,
    displayType: v.presetType ?? C.PRESET_UI_TYPE_BASE, // display non-preset types as "base" types
  }));
}

export function useAvailableUITypesForParam(
  sectionId,
  paramInfoId,
  selectedId,
) {
  return useSectionInfos((x) => {
    const nonPresetUITypeIds = getUITypeColAttr(
      sectionId,
      paramInfoId,
      "nonPresetUITypeIds",
      x,
    );

    const generalFilterFn = (x) => C.NON_SECTION_TYPES.includes(x.type);
    const nonPresetFilterFn = (uiType) =>
      isAmongNonPresets(uiType, nonPresetUITypeIds);

    return filterUITypes(
      x.uiTypes,
      generalFilterFn,
      nonPresetFilterFn,
      selectedId,
    );
  }, _.isEqual);
}
