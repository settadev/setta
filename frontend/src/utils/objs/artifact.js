import C from "constants/constants.json";
import DEFAULT_VALUES from "constants/defaultValues.json";
import _ from "lodash";
import { createRandomName } from "utils/idNameCreation";

export function newArtifact({ name, ...props }) {
  return _.merge(
    _.cloneDeep(DEFAULT_VALUES.artifact),
    { name: name ?? createRandomName() },
    props,
  );
}

export function newLayer({ name, ...props }) {
  return {
    name: name ?? createRandomName(),
    artifactTransforms: [],
    visible: true,
    layerOpacity: 0.5,
    brushOpacity: 1,
    ...props,
  };
}

export function newArtifactTransform(
  artifactId,
  sectionTypeName,
  artifactType,
) {
  return {
    artifactId,
    ...specificArtifactTransformProps(sectionTypeName, artifactType),
  };
}

function specificArtifactTransformProps(sectionTypeName, artifactType) {
  switch (sectionTypeName) {
    case C.DRAW:
      return {
        transform: [1, 0, 0, 1, 0, 0],
        eraserStrokes: artifactType === "img" ? [] : {},
      };
    case C.IMAGE:
    case C.CHART:
    case C.CHAT:
      return {};
    default:
      return {};
  }
}
