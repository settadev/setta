import C from "constants/constants.json";
import { dbDeleteTerminals } from "requests/terminals";
import { deleteNodes } from "state/actions/nodeInternals";
import { useActiveSection, useSectionInfos } from "state/definitions";
import { removeActiveSectionIds } from "../activeSections";
import {
  getAllSectionsForDeletionOrCopying,
  getSectionVariant,
  setSectionVariantChildren,
} from "../sectionInfos";
import { maybeIncrementProjectStateVersion } from "../undo";

export function deleteSections(sectionIds, state) {
  const idsToDelete = [
    ...new Set(getAllSectionsForDeletionOrCopying(sectionIds, state)),
  ];
  const terminalIds = idsToDelete.filter(
    (id) => state.uiTypes[state.x[id].uiTypeId].type === C.TERMINAL,
  );
  removeSectionInfos(idsToDelete, state);
  if (terminalIds) {
    dbDeleteTerminals(terminalIds);
  }
  removeActiveSectionIds(idsToDelete);
  deleteNodes(idsToDelete);
}

export function deleteChildrenFromSeries(isRoot, calledBy, numChildren = 1) {
  useSectionInfos.setState((state) => {
    if (isRoot) {
      const children = getSectionVariant(calledBy, state).children;
      deleteSections(children.slice(0, numChildren), state);
    } else {
      const parentId = state.x[calledBy].parentId;
      const siblings = getSectionVariant(parentId, state).children;
      const startIdx = siblings.indexOf(calledBy) + 1;
      deleteSections(siblings.slice(startIdx, startIdx + numChildren), state);
    }
  });

  maybeIncrementProjectStateVersion(true);
}

export function deleteAllActiveSections() {
  const sectionIds = useActiveSection.getState().ids;
  useSectionInfos.setState((state) => {
    deleteSections(sectionIds, state);
  });
  maybeIncrementProjectStateVersion(true);
}

function removeSectionInfos(ids, state) {
  const idSet = new Set(ids);
  for (const id of idSet) {
    const parentId = state.x[id]?.parentId;
    if (parentId && state.x[parentId]?.variantId) {
      setSectionVariantChildren(
        parentId,
        (children) => children.filter((x) => x !== id),
        state,
      );
    }

    let isStillUsedInAVariant = false;
    for (const variantInfo of Object.values(state.variants)) {
      if (variantInfo.children.includes(id)) {
        isStillUsedInAVariant = true;
        break;
      }
    }

    if (!isStillUsedInAVariant) {
      for (const variantId of state.x[id].variantIds) {
        delete state.variants[variantId];
      }
      delete state.x[id];
    }
  }

  for (const [k, v] of Object.entries(state.x)) {
    if (idSet.has(v.paramSweepSectionId)) {
      state.x[k].paramSweepSectionId = null;
    }
  }
}
