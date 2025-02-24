import C from "constants/constants.json";

export function getIsRoot(sectionTypeName) {
  return [C.LIST_ROOT, C.DICT_ROOT, C.GROUP].includes(sectionTypeName);
}

export const uiTypesToPretty = {
  [C.TEXT]: "Text",
  [C.SLIDER]: "Slider",
  [C.SWITCH]: "Switch",
  [C.COLOR_PICKER]: "Color Picker",
  [C.DROPDOWN]: "Dropdown",
  [C.PASSWORD]: "Password",
  [C.SECTION]: "Object",
  [C.LIST_ROOT]: "List of Objects",
  [C.DICT_ROOT]: "Dict of Objects",
  [C.GROUP]: "Group",
  [C.IMAGE]: "Image",
  [C.CHART]: "Chart",
  [C.DRAW]: "Drawing Area",
  [C.TEXT_BLOCK]: "Text Block",
  [C.SOCIAL]: "Social",
  [C.GLOBAL_VARIABLES]: "Global Variables",
  [C.CODE]: "Code",
  [C.PARAM_SWEEP]: "Parameter Sweep",
  [C.TERMINAL]: "Terminal",
  [C.GLOBAL_PARAM_SWEEP]: "Global Param Sweep",
};

export function createParamSweepSectionName(sectionName) {
  return `${sectionName} Sweep`;
}

export function isBasePreset(uiType) {
  return uiType.presetType === C.PRESET_UI_TYPE_BASE;
}

export function isUserPreset(uiType) {
  return uiType.presetType === C.PRESET_UI_TYPE_USER;
}

export function isPreset(uiType) {
  return isBasePreset(uiType) || isUserPreset(uiType);
}
