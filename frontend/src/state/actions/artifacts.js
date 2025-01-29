import {
  base64ToImageObj,
  dataURLToBase64,
} from "components/Section/Layouts/DrawArea/base64Conversion";
import C from "constants/constants.json";
import _ from "lodash";
import { dbLoadArtifacts, dbReadCSVBase64 } from "requests/artifacts";
import { useArtifacts, useSectionInfos } from "state/definitions";
import { createNewId } from "utils/idNameCreation";
import {
  newArtifact,
  newArtifactTransform,
  newLayer,
} from "utils/objs/artifact";
import { getSectionType } from "./sectionInfos";
import { maybeIncrementProjectStateVersion } from "./undo";

export async function loadArtifacts(sectionId, artifactIds, signal) {
  const res = await dbLoadArtifacts(artifactIds);
  if (res.status === 200) {
    const artifactsFromBackend = _.cloneDeep(res.data);
    await prepareArtifactsForRendering(artifactsFromBackend);
    if (signal?.aborted) return;
    useArtifacts.setState((state) => ({
      x: { ...state.x, ...artifactsFromBackend },
    }));
    useSectionInfos.setState((state) => {
      actionAfterSettingSectionArtifacts(artifactIds, sectionId, state);
    });
    maybeIncrementProjectStateVersion(true);
  }
}

async function prepareArtifactsForRendering(artifactsFromBackend) {
  for (const data of Object.values(artifactsFromBackend)) {
    data.value = await prepareArtifactForRendering(data.type, data.value);
  }
}

export async function prepareArtifactForRendering(type, value) {
  switch (type) {
    case "img":
      return await base64ToImageObj(value);
    case "list":
    case "brushStrokes":
      return value;
  }
}

export async function prepareDataURLForRendering(type, value) {
  switch (type) {
    case "img":
      return await base64ToImageObj(value);
    case "list":
      const res = await dbReadCSVBase64(dataURLToBase64(value));
      if (res.status == 200) {
        return res.data;
      }
    default:
      return null;
  }
}

export function getArtifactStateForSaving() {
  const result = {};

  for (const [key, value] of Object.entries(useArtifacts.getState().x)) {
    if (typeof value !== "function") {
      result[key] = value;
    }
  }

  for (const artifact of Object.values(result)) {
    if (artifact.type === "img" && artifact.value instanceof Image) {
      artifact.value = dataURLToBase64(artifact.value.src);
    }
  }

  return result;
}

export function addDrawAreaLayer(sectionId, state) {
  const artifactId = createNewId();
  const artifactType = "brushStrokes";
  useArtifacts.setState((state) => ({
    x: {
      ...state.x,
      [artifactId]: newArtifact({ type: artifactType, value: [] }),
    },
  }));

  const artifactGroupId = createNewId();
  state.artifactGroups[artifactGroupId] = newLayer({
    artifactTransforms: [
      newArtifactTransform(artifactId, C.DRAW, artifactType),
    ],
  });

  state.x[sectionId].artifactGroupIds.push(artifactGroupId);
  state.x[sectionId].canvasSettings.activeLayerId = artifactGroupId;
}

export function maybeAddArtifactGroupAndSetArtifactId({
  sectionId,
  sectionTypeName,
  artifactId,
  artifactType,
  createNewArtifactGroup = false,
  state,
}) {
  let artifactGroupId = getActiveArtifactGroupId(
    sectionId,
    sectionTypeName,
    state,
  );

  if (!artifactGroupId || createNewArtifactGroup) {
    artifactGroupId = createNewId();
    state.artifactGroups[artifactGroupId] = newLayer({});
    state.x[sectionId].artifactGroupIds.unshift(artifactGroupId);
  }

  const artifactTransform = newArtifactTransform(
    artifactId,
    sectionTypeName,
    artifactType,
  );

  if (sectionTypeName === C.DRAW) {
    state.artifactGroups[artifactGroupId].artifactTransforms.push(
      artifactTransform,
    );
  } else {
    state.artifactGroups[artifactGroupId].artifactTransforms = [
      artifactTransform,
    ];
  }

  actionAfterSettingSectionArtifacts([artifactId], sectionId, state);
}

export async function addArtifactAndMaybeCreateNewArtifactGroup({
  sectionId,
  createNewArtifactGroup,
  value,
  artifactType,
  path = "",
}) {
  const artifactId = createNewId();
  useArtifacts.setState((state) => ({
    x: {
      ...state.x,
      [artifactId]: newArtifact({
        value,
        path,
        type: artifactType,
      }),
    },
  }));
  useSectionInfos.setState((state) => {
    const sectionTypeName = getSectionType(sectionId, state);
    maybeAddArtifactGroupAndSetArtifactId({
      sectionId,
      sectionTypeName,
      artifactId,
      artifactType,
      createNewArtifactGroup,
      state,
    });
  });
}

function getActiveArtifactGroupId(sectionId, sectionTypeName, state) {
  switch (sectionTypeName) {
    case C.DRAW:
      return state.x[sectionId].canvasSettings.activeLayerId;
    case C.IMAGE:
    case C.CHART:
      return state.x[sectionId].artifactGroupIds[0];
  }
}

function actionAfterSettingSectionArtifacts(artifactIds, sectionId, state) {
  const sectionTypeName = getSectionType(sectionId, state);
  if (sectionTypeName === C.CHART) {
    const artifact = useArtifacts.getState().x[artifactIds[0]];
    const columnNames = artifact ? Object.keys(artifact.value) : null;
    const chartSettings = state.x[sectionId].chartSettings;
    if (columnNames && !columnNames.includes(chartSettings.xAxisColumn)) {
      chartSettings.xAxisColumn = columnNames[0];
    }
  }
}

export function getNamePathTypeKey(artifact) {
  return JSON.stringify([artifact["name"], artifact["path"], artifact["type"]]);
}
