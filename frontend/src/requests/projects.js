import C from "constants/constants.json";
import { post } from "./utils";

export async function dbGetAllProjectConfigMetadata() {
  return await post({
    body: {},
    address: C.ROUTE_ALL_PROJECT_CONFIG_METADATA,
  });
}

export async function dbLoadProjectConfigNames() {
  return await post({
    body: {},
    address: C.ROUTE_LOAD_PROJECT_CONFIG_NAMES,
  });
}

export async function dbLoadProjectConfig(projectConfigName) {
  return await post({
    body: { projectConfigName },
    address: C.ROUTE_LOAD_PROJECT_CONFIG,
  });
}

export async function dbLoadFullProject({ excludeProjectConfigName }) {
  return await post({
    body: { excludeProjectConfigName },
    address: C.ROUTE_LOAD_FULL_PROJECT,
  });
}

export async function dbCreateProjectConfig({ name, previewImgColor }) {
  return await post({
    address: C.ROUTE_CREATE_PROJECT_CONFIG,
    body: { name, previewImgColor },
  });
}

export async function dbSaveProject({ project }) {
  return await post({
    address: C.ROUTE_SAVE_PROJECT,
    body: { project },
  });
}

export async function dbSaveAsNewProjectConfig({
  project,
  newConfigName,
  withRefs,
}) {
  return await post({
    address: C.ROUTE_SAVE_AS_NEW_PROJECT_CONFIG,
    body: { project, newConfigName, withRefs },
  });
}

export async function dbSaveAsExistingProjectConfig({ project, configName }) {
  return await post({
    address: C.ROUTE_SAVE_AS_EXISTING_PROJECT_CONFIG,
    body: { project, configName },
  });
}

export async function dbDeleteProjectConfigs(ids) {
  return await post({
    address: C.ROUTE_DELETE_PROJECT_CONFIGS,
    body: { ids },
  });
}

export async function dbGetDefaultConfigName() {
  return await post({
    address: C.ROUTE_GET_DEFAULT_CONFIG_NAME,
    body: {},
  });
}

export async function dbSetAsDefaultProject(projectId) {
  return await post({
    address: C.ROUTE_SET_AS_DEFAULT_PROJECT,
    body: { projectId },
  });
}

export async function dbFilterDataForJSONExport(project) {
  return await post({
    address: C.ROUTE_FILTER_DATA_FOR_JSON_EXPORT,
    body: { project },
  });
}

export async function dbAddDefaultDataForJSONImport(project) {
  return await post({
    address: C.ROUTE_ADD_DEFAULT_DATA_FOR_JSON_IMPORT,
    body: { project },
  });
}
