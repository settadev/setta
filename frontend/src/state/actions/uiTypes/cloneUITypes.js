import _ from "lodash";
import { isPreset } from "state/actions/uiTypes/utils";
import { createNewId } from "utils/idNameCreation";

export function maybeGetExistingUIType({
  currUIType,
  nonPresetUITypeIds,
  state,
}) {
  // If it's a preset
  // then use existing non-preset, or copy into a new non-preset ui type.
  let maybeExistingUIType = currUIType;
  if (isPreset(currUIType)) {
    // Try using existing non-preset (uiType with same type and that belongs to nonPresetUITypeIds)
    const matches = _.filter(state.uiTypes, (v) =>
      isAmongNonPresetsAndMatchesType(v, nonPresetUITypeIds, currUIType.type),
    );

    // If there's no match, create a non-preset
    maybeExistingUIType = matches.length > 0 ? matches[0] : null;
  }

  return maybeExistingUIType;
}

export function cloneNewUIType({
  uiType,
  name = "",
  config,
  presetType = null,
}) {
  const newUIType = _.cloneDeep(uiType);
  newUIType.id = createNewId();
  newUIType.name = name;
  newUIType.presetType = presetType;
  if (!_.isNil(config)) {
    newUIType.config = config;
  }
  return newUIType;
}

export function isAmongNonPresets(v, nonPresetUITypeIds) {
  return nonPresetUITypeIds.includes(v.id);
}

function isAmongNonPresetsAndMatchesType(v, nonPresetUITypeIds, type) {
  return isAmongNonPresets(v, nonPresetUITypeIds) && v.type === type;
}
