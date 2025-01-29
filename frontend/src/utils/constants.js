import BASE_UI_TYPES from "constants/BaseUITypes.json";
import C from "constants/constants.json";

export const NO_CONTEXT_MENU = import.meta.env.MODE === "ncm";
export const OVERVIEW = "overview";
export const UI_EDITOR = "uiEditor";

export const INITIAL_OVERVIEW_WIDTH = 335;
export const INITIAL_UI_EDITOR_WIDTH = 500;
export const CLOSED_PANE_WIDTH = 50;
export const NAVBAR_HEIGHT = 48;

// constants object
export const URLS = {};
export const BASE_UI_TYPE_IDS = {};

export function globalConstInit() {
  const DEV_MODE = import.meta.env.DEV;
  if (DEV_MODE) {
    URLS.BACKEND = `http://${C.DEFAULT_HOST}:${C.DEFAULT_PORT}${C.ROUTE_PREFIX}`;
    URLS.WEBSOCKET = `ws://${C.DEFAULT_HOST}:${C.DEFAULT_PORT}${C.ROUTE_PREFIX}`;
  } else {
    URLS.BACKEND = `http://${location.host}${C.ROUTE_PREFIX}`;
    URLS.WEBSOCKET = `ws://${location.host}${C.ROUTE_PREFIX}`;
  }

  for (const [k, v] of Object.entries(BASE_UI_TYPES)) {
    BASE_UI_TYPE_IDS[v.type] = k;
  }
}

export const SECTION_CONFIG_TAB = "SectionConfig";
export const QUICKINFO_CONFIG_TAB = "QuickInfoConfig";
export const UI_CONFIG_TAB = "UIConfig";
export const INFO_CONFIG_TAB = "InfoConfig";
export const SECTION_VARIANTS_TAB = "SectionVariantsConfig";

export const tabNameToPretty = {
  [UI_CONFIG_TAB]: "Params",
  [SECTION_CONFIG_TAB]: "Section",
  [QUICKINFO_CONFIG_TAB]: "Quick Info",
  [INFO_CONFIG_TAB]: "Text Editor",
  [SECTION_VARIANTS_TAB]: "Version",
};

export const PROJECT_CONFIG_PREVIEW_IMG_COLORS = [
  "bg-red-500/60 dark:bg-red-600/30",
  "bg-pink-500/60 dark:bg-pink-600/30",
  "bg-purple-500/60 dark:bg-purple-600/30",
  "bg-indigo-500/60 dark:bg-indigo-600/30",
  "bg-blue-500/60 dark:bg-blue-600/30",
  "bg-green-500/60 dark:bg-green-600/30",
  "bg-yellow-500/60 dark:bg-yellow-600/30",
  "bg-orange-500/60 dark:bg-orange-600/30",
];

export const INDEX_ROUTER_PATH = "/";
export const HOME_ROUTER_PATH = "/home";
export const PROJECT_CONFIG_ROUTER_PATH = "/:projectConfigName";
export const SETTINGS_PROJECT_NAME = "settings";
export const SETTINGS_ROUTER_PATH = `/${SETTINGS_PROJECT_NAME}`;

export function pathRelativeToProject(projectConfigName) {
  return `../${projectConfigName}`;
}

export const MODAL_PURPOSE = { LOAD: "LOAD", SAVE: "SAVE" };

export const MODAL_TYPE = {
  LOAD_PROJECT_CONFIG: {
    purpose: MODAL_PURPOSE.LOAD,
    title: "Load Project Config",
    buttonText: "Load",
  },
  SAVE_PROJECT_CONFIG_AS: {
    purpose: MODAL_PURPOSE.SAVE,
    title: "Save Project Config As",
    buttonText: "Save As",
  },
  SAVE_PROJECT_CONFIG_AS_WITH_REFS: {
    purpose: MODAL_PURPOSE.SAVE,
    title: "Save Project Config As (With Refs)",
    buttonText: "Save As",
  },
  EXPORT_JSON: {
    purpose: null,
    title: "Export JSON",
    buttonText: null,
  },
  IMPORT_JSON: {
    purpose: null,
    title: "Import JSON",
    buttonText: "Import",
  },
  SAVE_UI_TYPE_CONFIG: {
    purpose: MODAL_PURPOSE.SAVE,
    title: "Save UI Type Config",
    buttonText: "Save",
  },
  SAVE_CUSTOM_ARGUMENTS: {
    purpose: MODAL_PURPOSE.SAVE,
    title: "Save Custom Arguments",
    buttonText: "Save",
  },
  DELETE_PROJECT_WARNING: {
    purpose: null,
    title: "Confirm Deletion",
  },
  RENAME_REFERENCES: {
    purpose: null,
    title: "Rename References",
    buttonText: "Rename",
  },
  DELETE_JSON_SOURCE_FILE: {
    purpose: null,
    title: "Delete JSON Source File",
    buttonText: "Delete",
  },
  ADD_ARTIFACT_BY_FILEPATH: {
    purpose: null,
    title: "Add Artifact By Filepath",
    buttonText: "Delete",
  },
};

export const PAGE_LOAD_TYPES = {
  LOAD_PROJECT_CONFIG: "LOAD_PROJECT_CONFIG",
  CHANGE_PROJECT_CONFIG_NAME: "CHANGE_PROJECT_CONFIG_NAME",
};

export const NO_DRAG_CLASS_NAME = "nodrag";
export const NO_WHEEL_CLASS_NAME = "nowheel";
export const NO_PAN_CLASS_NAME = "nopan";
export const SETTA_PREVENT_SECTION_ACTIVE_CSS =
  "setta-prevent-section-active-css";
export const SETTA_PREVENT_SECTION_ON_CLICK_TRIGGER =
  "setta-prevent-section-on-click-trigger";
export const SETTA_PREVENT_ARROW_KEYS_MOVING_SECTION =
  "setta-prevent-arrow-keys-moving-section";

export const SECTION_DISPLAY_MODES = {
  RENDER: "RENDER",
  EDIT: "EDIT",
  YAML: "YAML",
  GUI: "GUI",
};

export const RENAME_REFERENCES_ON_SECTION_MOVE_MODES = {
  ALWAYS_ASK: "Always Ask",
  ALWAYS_RENAME: "Always Rename",
  NEVER_RENAME: "Never Rename",
};
