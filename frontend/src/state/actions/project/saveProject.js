import C from "constants/constants.json";
import { getViewport } from "forks/xyflow/core/hooks/useViewportHelper";
import { useReactFlow } from "forks/xyflow/core/store";
import _ from "lodash";
import {
  dbSaveAsExistingProjectConfig,
  dbSaveAsNewProjectConfig,
  dbSaveProject,
} from "requests/projects";
import { dbSaveSettingsProject } from "requests/settings";
import {
  useNodeInternals,
  useSectionColumnWidth,
  useSectionInfos,
  useSettings,
} from "state/definitions";
import { SECTION_DISPLAY_MODES, SETTINGS_PROJECT_NAME } from "utils/constants";
import { getArtifactStateForSaving } from "../artifacts";
import { yamlToGUI } from "../guiToYaml";
import { setNotificationMessage } from "../notification";
import { getSectionType } from "../sectionInfos";
import { requestBase64FromCanvas } from "../temporaryMiscState";

export function getProjectData({
  withArtifacts = false,
  convertYamlToGUI = true,
}) {
  // remove temporary sections
  let sections = _.cloneDeep(useSectionInfos.getState().x);
  sections = _.pickBy(sections, (x) => !x.isTemporary);
  if (convertYamlToGUI) {
    for (const s of Object.values(sections)) {
      if (s.displayMode === SECTION_DISPLAY_MODES.YAML) {
        yamlToGUI(s.id);
      }
    }
  }
  sections = _.mapValues(sections, (x) => {
    x.columnWidth = useSectionColumnWidth.getState()[x.id];
    return x;
  });

  const artifacts = withArtifacts ? getArtifactStateForSaving() : {};

  const sectionVariants = _.mapValues(
    useSectionInfos.getState().variants,
    (x) => ({
      ...x,
      // need this filter because some sections might be temporary
      children: x.children.filter((c) => c in sections),
    }),
  );
  const artifactGroups = useSectionInfos.getState().artifactGroups;
  const uiTypes = _.pickBy(
    useSectionInfos.getState().uiTypes,
    (u) => u.presetType !== C.PRESET_UI_TYPE_BASE,
  );
  const uiTypeCols = useSectionInfos.getState().uiTypeCols;

  const codeInfo = useSectionInfos.getState().codeInfo;
  const codeInfoCols = useSectionInfos.getState().codeInfoCols;

  const projectConfig = getProjectConfigMetadata();
  const children = {};
  for (const c of useNodeInternals.getState().x.values()) {
    if (c.id in sections) {
      // need this filter because some sections might be temporary
      children[c.id] = {
        x: c.position.x,
        y: c.position.y,
        zIndex: c.zIndex,
        w: c.width, // save width and height so we can show preview on home page
        h: c.height,
      };
    }
  }
  projectConfig.children = children;

  const output = {
    projectConfig,
    sectionVariants,
    artifacts,
    artifactGroups,
    uiTypes,
    uiTypeCols,
    sections,
    codeInfo,
    codeInfoCols,
  };

  return output;
}

export async function saveProject() {
  let res;
  setNotificationMessage("Saving...");
  if (useSectionInfos.getState().projectConfig.name === SETTINGS_PROJECT_NAME) {
    res = await dbSaveSettingsProject(getProjectData({}));
    if (res.status === 200) {
      useSettings.setState(res.data);
    }
  } else {
    res = await dbSaveProject({
      project: await getProjectDataForSaving(),
    });
  }

  if (res.status === 200) {
    setNotificationMessage("Saved!");
  }
}

export async function saveAsNewProjectConfig({ newConfigName, withRefs }) {
  return await saveProjectAs({
    fn: dbSaveAsNewProjectConfig,
    otherArgs: { newConfigName, withRefs },
  });
}

export async function saveAsExistingProjectConfig({ configName }) {
  return await saveProjectAs({
    fn: dbSaveAsExistingProjectConfig,
    otherArgs: { configName },
  });
}

async function saveProjectAs({ fn, otherArgs }) {
  await fn({
    project: await getProjectDataForSaving(),
    ...otherArgs,
  });
}

function getProjectConfigMetadata() {
  const state = useSectionInfos.getState().projectConfig;
  const output = {
    id: state.id,
    name: state.name,
    previewImgColor: state.previewImgColor,
    viewingEditingMode: state.viewingEditingMode,
  };

  output.viewport = useReactFlow.getState().fitViewOnInit
    ? null
    : getViewport();

  return output;
}

export async function getProjectDataForSaving() {
  const project = getProjectData({
    withArtifacts: true,
    convertYamlToGUI: true,
  });

  if (useSettings.getState().backend.saveRenderedValues) {
    await updateSectionsWithRenderedValues(project["sections"]);
  }

  return project;
}

async function updateSectionsWithRenderedValues(sections) {
  for (const sectionId of Object.keys(sections)) {
    if ([C.DRAW, C.CHART].includes(getSectionType(sectionId))) {
      sections[sectionId].renderedValue =
        await requestBase64FromCanvas(sectionId);
    }
  }
}
