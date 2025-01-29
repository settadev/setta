import C from "constants/constants.json";
import DEFAULT_VALUES from "constants/defaultValues.json";
import _ from "lodash";
import { clamp } from "utils/utils";

export function getValueForUIType({ uiType, currValue }) {
  switch (uiType.type) {
    case C.TEXT:
    case C.PASSWORD:
      return convertValueForText({ currValue });
    case C.SLIDER:
      return convertValueForSlider({ uiType, currValue });
    case C.SWITCH:
      return convertValueForSwitch({ currValue });
    case C.COLOR_PICKER:
      return convertValueForColorPicker({ currValue });
    case C.DROPDOWN:
      return convertValueForDropdown({ currValue });
    default:
      return "";
  }
}

function convertValueForText({ currValue }) {
  if (!_.isNil(currValue)) {
    return currValue;
  }
  return "";
}

function convertValueForSlider({ uiType, currValue }) {
  const x = _.toNumber(currValue);
  if (_.isFinite(x)) {
    return _.toString(clamp(x, uiType.config.min, uiType.config.max));
  }
  return _.toString(uiType.config.min);
}

function convertValueForSwitch({ currValue }) {
  if (!_.isNil(currValue)) {
    return currValue === "0" ? "false" : "true";
  }
  return "false";
}

function convertValueForColorPicker({ currValue }) {
  // Regular expression to match #fff or #ffffff format (case insensitive)
  const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  if (hexColorRegex.test(currValue)) {
    return currValue;
  }
  return "#ff0000";
}

function convertValueForDropdown({ currValue }) {
  if (!_.isNil(currValue)) {
    return currValue;
  }
  return "";
}

export function newEVEntry() {
  return _.cloneDeep(DEFAULT_VALUES.evEntry);
}
