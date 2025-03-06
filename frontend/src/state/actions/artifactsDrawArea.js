import C from "constants/constants.json";
import _ from "lodash";
import { getSectionType } from "state/actions/sectionInfos";
import { useMisc, useSectionInfos } from "state/definitions";
import { getAllSectionArtifactIds } from "state/hooks/artifacts";

export function maybeRequestDrawAreaUpdate(newVal, oldVal) {
  const idToModifiedBy = {};
  for (const [id, a] of Object.entries(newVal)) {
    // modifiedByInfo contains keys: modifiedBy and timestamp
    if (!_.isEqual(a, oldVal[id])) {
      idToModifiedBy[id] = a.modifiedBy;
    }
  }

  if (_.size(idToModifiedBy) === 0) {
    return;
  }

  const sectionState = useSectionInfos.getState();
  const drawAreasToUpdate = [];
  for (const s of Object.values(sectionState.x)) {
    if (getSectionType(s.id, sectionState) !== C.DRAW) {
      continue;
    }
    const artifactIds = getAllSectionArtifactIds(s.id, sectionState);
    for (const [artifactId, modifiedBy] of Object.entries(idToModifiedBy)) {
      if (artifactIds.has(artifactId) && modifiedBy !== s.id) {
        drawAreasToUpdate.push(s.id);
        break;
      }
    }
  }
  if (drawAreasToUpdate.length === 0) {
    return;
  }

  useMisc.setState((state) => {
    const newUpdateDrawArea = { ...state.updateDrawArea };
    for (const s of drawAreasToUpdate) {
      if (!(s in newUpdateDrawArea)) {
        newUpdateDrawArea[s] = 0;
      }
      newUpdateDrawArea[s] += 1;
    }
    return { updateDrawArea: newUpdateDrawArea };
  });
}
