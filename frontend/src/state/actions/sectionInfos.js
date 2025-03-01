import C from "constants/constants.json";
import { useDndChildren } from "forks/dnd-kit/dndChildren";
import _ from "lodash";
import { dbGetJSONSourcePathToBeDeleted } from "requests/jsonSource";
import { useSectionInfos } from "state/definitions";
import { VIEWING_EDITING_MODE } from "utils/constants";
import { createNewId } from "utils/idNameCreation";
import { newCodeInfoCol } from "utils/objs/codeInfoCol";
import { newEVEntry } from "utils/objs/ev";
import { openDeleteJSONSourceFileModal } from "./modal";
import { waitForFileDeletion } from "./temporaryMiscState";

export function getSectionInfo(sectionId) {
  return useSectionInfos.getState().x[sectionId];
}

export function getSectionParentId(sectionId) {
  return getSectionInfo(sectionId).parentId;
}

export function getSectionType(sectionId, _state) {
  const state = _state ?? useSectionInfos.getState();
  return state.uiTypes[state.x[sectionId].uiTypeId].type;
}

export function getSectionVariant(sectionId, _state) {
  const state = _state ?? useSectionInfos.getState();
  return state.variants[state.x[sectionId].variantId];
}

export function getHighestAncestor(
  sectionId,
  parentIdGetter = getSectionParentId,
) {
  let parentId = parentIdGetter(sectionId);
  let highestAncestor = sectionId;

  while (parentId) {
    highestAncestor = parentId;
    parentId = parentIdGetter(parentId);
  }

  return highestAncestor;
}

export function getSectionPathFullName(sectionId, state) {
  let parentId = state.x[sectionId].parentId;
  if (!parentId) {
    return state.x[sectionId].name;
  }

  let childId = sectionId;
  let output = "";
  while (parentId) {
    if (getSectionType(parentId, state) === C.LIST_ROOT) {
      const idx = getSectionVariant(parentId, state).children.indexOf(
        sectionId,
      );
      output = `[${idx}]${output}`;
    } else {
      output = `["${state.x[childId].name}"]${output}`;
    }
    childId = parentId;
    parentId = state.x[parentId].parentId;
  }

  // childId will contain the highest parent's id
  return `${state.x[childId].name}${output}`;
}

export function getSectionDescendants(sectionId, state) {
  const ids = [sectionId];
  let idx = 0;
  while (idx < ids.length) {
    const currId = ids[idx];
    ids.push(...getSectionVariant(currId, state).children);
    idx += 1;
  }
  return ids;
}

export function toggleSectionOrientation(sectionId) {
  useSectionInfos.setState((state) => {
    state.x[sectionId].isHorizontalOrientation =
      !state.x[sectionId].isHorizontalOrientation;
  });
}

export function toggleSectionLock(sectionId) {
  useSectionInfos.setState((state) => {
    state.x[sectionId].positionAndSizeLocked =
      !state.x[sectionId].positionAndSizeLocked;
  });
}

export function manualDndChildrenReset() {
  useDndChildren.getState().update(getDisplayedSectionIdToChildren());
}

export function setAllPreviewVariantIdsToNull() {
  useSectionInfos.setState((x) => {
    for (const s of Object.values(x.x)) {
      s.previewVariantId = null;
    }
  });
}

export function updateSectionInfos({
  sections,
  sectionVariants,
  uiTypes,
  uiTypeCols,
  codeInfo,
  codeInfoCols,
  state,
}) {
  state.x = { ...state.x, ...sections };
  state.variants = { ...state.variants, ...sectionVariants };
  state.uiTypes = { ...state.uiTypes, ...uiTypes };
  state.uiTypeCols = { ...state.uiTypeCols, ...uiTypeCols };
  state.codeInfo = { ...state.codeInfo, ...codeInfo };
  state.codeInfoCols = { ...state.codeInfoCols, ...codeInfoCols };
}

export function setEnteredValue(variantId, paramInfoId, value, state) {
  if (!(paramInfoId in state.variants[variantId].values)) {
    state.variants[variantId].values[paramInfoId] = newEVEntry();
  }
  state.variants[variantId].values[paramInfoId].value = value;
}

export function setParamEnteredValue(sectionId, paramInfoId, value, state) {
  setEnteredValue(state.x[sectionId].variantId, paramInfoId, value, state);
}

export function getCodeInfoCol(sectionId, _state) {
  const state = _state ?? useSectionInfos.getState();
  const codeInfoColId = getSectionVariant(sectionId, state).codeInfoColId;
  return codeInfoColId ? state.codeInfoCols[codeInfoColId] : newCodeInfoCol();
}

export function getDisplayedCodeInfoCol(sectionId, _state) {
  const state = _state ?? useSectionInfos.getState();
  return state.codeInfoCols[
    getDisplayedSectionVariant(sectionId, state).codeInfoColId
  ];
}

export function getDisplayedSectionVariant(sectionId, _state) {
  const state = _state ?? useSectionInfos.getState();
  return state.variants[getDisplayedSectionVariantId(sectionId, state)];
}

export function getDisplayedSectionVariantId(sectionId, _state) {
  const state = _state ?? useSectionInfos.getState();
  return state.x[sectionId].previewVariantId ?? state.x[sectionId].variantId;
}

export function setSectionVariantChildren(sectionId, newStateFn, state) {
  const variant = getSectionVariant(sectionId, state);
  variant.children = newStateFn(variant.children);
}

function getDisplayedSectionIdToChildrenHelper(sectionId, state, output) {
  const children = getDisplayedSectionVariant(sectionId, state).children;
  output[sectionId] = children;
  if (children) {
    for (const childId of children) {
      getDisplayedSectionIdToChildrenHelper(childId, state, output);
    }
  }
}

export function getDisplayedSectionIdToChildren(
  state,
  includeNullAsRoot = false,
) {
  const output = {};
  const s = state ?? useSectionInfos.getState();
  for (const section of Object.values(s.x)) {
    if (!section.parentId) {
      getDisplayedSectionIdToChildrenHelper(section.id, s, output);
      if (includeNullAsRoot) {
        if (!(null in output)) {
          output[null] = [];
        }
        output[null].push(section.id);
      }
    }
  }
  return output;
}

export function getSectionIdToParentId(state) {
  const output = {};
  const s = state ?? useSectionInfos.getState();
  for (const section of Object.values(s.x)) {
    output[section.id] = section.parentId;
  }
  return output;
}

function getSectionDescendantsFromAllVariants(sectionId, state) {
  const output = [];
  for (const v of state.x[sectionId].variantIds) {
    output.push(...state.variants[v].children);
  }
  return output;
}

export function getAllSectionsForDeletionOrCopying(sectionIds, state) {
  const idsToDelete = [...sectionIds];
  let idx = 0;
  while (idx < idsToDelete.length) {
    const idxChildren = getSectionDescendantsFromAllVariants(
      idsToDelete[idx],
      state,
    );
    const { paramSweepSectionId } = state.x[idsToDelete[idx]];
    if (idxChildren) {
      idsToDelete.push(...idxChildren);
    }
    if (paramSweepSectionId) {
      idsToDelete.push(paramSweepSectionId);
    }
    idx += 1;
  }
  return idsToDelete;
}

export function setDefaultSectionVariant(sectionId, variantId) {
  useSectionInfos.setState((x) => {
    x.x[sectionId].defaultVariantId = variantId;
  });
}

export function resetSectionsToDefaultVersions(sectionIds) {
  useSectionInfos.setState((x) => {
    for (const id of sectionIds) {
      const s = x.x[id];
      s.variantId = s.defaultVariantId;
    }
  });
}

export function resetAllSectionsToDefaultVersions() {
  resetSectionsToDefaultVersions(Object.keys(useSectionInfos.getState().x));
}

export function duplicateCodeInfoCol(id, state) {
  const newId = createNewId();
  const s = state.codeInfoCols;
  s[newId] = _.cloneDeep(s[id]);
  return newId;
}

export function duplicateSectionVariant(id, newName, newCodeInfoColId, state) {
  const newId = createNewId();
  const s = state.variants;
  s[newId] = _.cloneDeep(s[id]);
  s[newId].name = newName;
  s[newId].codeInfoColId = newCodeInfoColId;
  s[newId].isFrozen = false;
  return newId;
}

export function getCodeChildrenAndParentCodeInfoId(
  sectionId,
  state,
  variantId = null,
) {
  const sectionVariant = variantId
    ? state.variants[variantId]
    : getDisplayedSectionVariant(sectionId, state);
  const { codeInfoColId } = sectionVariant;
  const parentCodeInfoId = sectionVariant.selectedItem;

  const codeInfoChildren = codeInfoColId
    ? state.codeInfoCols[codeInfoColId].children
    : newCodeInfoCol().children;

  return { codeInfoChildren, parentCodeInfoId };
}

export async function deleteSectionVariantAndMaybeJsonFile(
  sectionId,
  variantId,
  isCurr,
) {
  const state = useSectionInfos.getState();
  const { name: variantName, isJsonSource } = state.variants[variantId];
  if (isJsonSource) {
    const res = await dbGetJSONSourcePathToBeDeleted(variantName);
    if (res.status == 200) {
      openDeleteJSONSourceFileModal(res.data);
      const wasDeleted = await waitForFileDeletion(res.data);
      if (wasDeleted) {
        deleteSectionVariant(sectionId, variantId, isCurr);
      }
    }
  } else {
    deleteSectionVariant(sectionId, variantId, isCurr);
  }
}

function deleteSectionVariant(sectionId, variantId, isCurr) {
  useSectionInfos.setState((state) => {
    const section = state.x[sectionId];
    section.variantIds = section.variantIds.filter((v) => v !== variantId);
    if (section.defaultVariantId === variantId) {
      section.defaultVariantId = section.variantIds[0];
    }
    if (isCurr) {
      section.variantId = section.variantIds[0];
    }
    delete state.variants[variantId];
  });
}

export function getSectionShouldRender(visibility, viewingEditingMode) {
  return visibility || viewingEditingMode !== VIEWING_EDITING_MODE.USER;
}

export function getSectionViewingEditingModeVisibility(sectionId, state) {
  const { viewingEditingMode } = state.projectConfig;
  return {
    visibility:
      state.x[sectionId].visibility[
        getSectionVisibilityKey(viewingEditingMode)
      ],
    viewingEditingMode,
  };
}

export function getSectionVisibilityKey(viewingEditingMode) {
  switch (viewingEditingMode) {
    case VIEWING_EDITING_MODE.DEV:
    case VIEWING_EDITING_MODE.USER:
      return viewingEditingMode;
    case VIEWING_EDITING_MODE.USER_EDIT:
      return VIEWING_EDITING_MODE.USER;
  }
}

export function getAncestorSameVisibility(sectionId, state) {
  const { viewingEditingMode } = state.projectConfig;
  let { parentId } = state.x[sectionId];
  const key = getSectionVisibilityKey(viewingEditingMode);
  const targetVisibility = state.x[sectionId].visibility[key];

  while (parentId) {
    if (state.x[parentId].visibility[key] === targetVisibility) return true;

    ({ parentId } = state.x[parentId]);
  }

  return false;
}

export function getIsUserView(viewingEditingMode) {
  return viewingEditingMode === VIEWING_EDITING_MODE.USER;
}
