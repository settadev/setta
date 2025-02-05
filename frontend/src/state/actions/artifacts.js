import {
  base64ToImageObj,
  dataURLToBase64,
} from "components/Section/Layouts/DrawArea/base64Conversion";
import C from "constants/constants.json";
import _ from "lodash";
import { dbLoadArtifacts, dbReadCSVBase64 } from "requests/artifacts";
import { useArtifacts, useMisc, useSectionInfos } from "state/definitions";
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

  const currArtifactGroup = state.artifactGroups[artifactGroupId];
  if (sectionTypeName === C.DRAW || sectionTypeName === C.CHART) {
    currArtifactGroup.artifactTransforms.push(artifactTransform);
  } else {
    currArtifactGroup.artifactTransforms = [artifactTransform];
  }

  actionAfterSettingSectionArtifacts(
    currArtifactGroup.artifactTransforms.map((x) => x.artifactId),
    sectionId,
    state,
  );
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
  const { chartSettings } = state.x[sectionId];
  if (sectionTypeName === C.CHART) {
    const artifactValue = processChartArtifacts(
      artifactIds.map((a) => useArtifacts.getState().x[a]),
      chartSettings.type,
    );
    const seriesNames = Object.keys(artifactValue);
    useMisc.setState((state) => ({
      chartDisplayedSeriesNames: {
        ...state.chartDisplayedSeriesNames,
        [sectionId]: seriesNames,
      },
    }));
    if (seriesNames === 0) {
      return;
    }
    if (!seriesNames.includes(chartSettings.xAxisColumn)) {
      chartSettings.xAxisColumn = seriesNames[0];
    }
  }
}

// doesn't need whole artifacts, just name and value
export function processChartArtifacts(artifacts, chartType) {
  switch (chartType) {
    case "line":
      return processLineChartArtifacts(artifacts);
    case "scatter":
      return processScatterChartArtifacts(artifacts);
    default:
      return {};
  }
}

function processLineChartArtifacts(artifacts) {
  const output = {};
  for (const artifact of artifacts) {
    for (const [seriesName, values] of Object.entries(artifact.value)) {
      const newSeriesName =
        artifacts.length === 1 ? seriesName : `${artifact.name}/${seriesName}`;
      output[newSeriesName] = [...values];
    }
  }
  return output;
}

function processScatterChartArtifacts(artifacts) {
  const output = {};
  for (const artifact of artifacts) {
    for (const [seriesName, values] of Object.entries(artifact.value)) {
      if (!(seriesName in output)) {
        output[seriesName] = [];
      }
      output[seriesName].push(...values);
    }
  }
  return output;
}

export function getNamePathTypeKey(artifact) {
  return JSON.stringify([artifact["name"], artifact["path"], artifact["type"]]);
}
