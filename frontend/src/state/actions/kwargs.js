import C from "constants/constants.json";
import { useSectionInfos } from "state/definitions";
import { findAllParametersAndPathMaps } from "utils/getDescendants";
import { createNewParamId, createRandomName } from "utils/idNameCreation";
import { newCodeInfo } from "utils/objs/codeInfo";
import { addCodeInfo, deleteCodeInfo, getParamPath } from "./codeInfo";
import { getCodeInfoCol, getSectionVariant } from "./sectionInfos";

export function addKwarg({
  sectionId,
  parentId = null,
  insertIdx = null,
  state,
}) {
  const { jsonSource, jsonSourceKeys } = state.x[sectionId];
  let actualName = name;
  let paramPath = null;
  if (jsonSource) {
    if (!actualName) {
      actualName = createRandomName();
    }
    paramPath = getParamPath(sectionId, actualName, parentId, state);
  }
  const kwargInfo = newCodeInfo({
    id: createNewParamId(paramPath, jsonSource, jsonSourceKeys),
    name: actualName,
    rcType: C.PARAMETER,
    editable: true,
  });
  addCodeInfo({
    sectionId,
    info: kwargInfo,
    parent: parentId,
    insertIdx,
    state,
  });
  return kwargInfo.id;
}

export function deleteLastKwarg({ sectionId, parentId = null, state }) {
  const kwargIds = getKwargIds(sectionId, parentId, state);
  const numKwargs = kwargIds.length;
  if (numKwargs === 0) {
    return;
  }
  const kwargId = kwargIds[numKwargs - 1];
  deleteCodeInfo(sectionId, [kwargId], state);
}

export function deleteSelectedKwargs(sectionId) {
  useSectionInfos.setState((x) => {
    const { ids: selectedParamIds } = getAllSelectedParamIds(sectionId, x);
    deleteCodeInfo(sectionId, selectedParamIds, x);
  });
}

export function saveKwargsAsCollection({ sectionId, name }) {
  // // TODO: update this because children are no longer stored in codeInfo
  // const { ids: children } = getParamIds(sectionId);
  // const collection = newCodeInfo({
  //   name,
  //   rcType: C.COLLECTION,
  // });
  // dbSaveCodeInfo({
  //   codeInfo: { [collection.id]: collection },
  // });
}

export function pinSelectedKwargs(sectionId) {
  useSectionInfos.setState((x) => {
    const { ids: selectedParamIds } = getAllSelectedParamIds(sectionId, x);
    for (const p of selectedParamIds) {
      x.codeInfo[p].isPinned = !x.codeInfo[p].isPinned;
      x.codeInfo[p].isSelected = false;
    }
  });
}

export function toggleParamSelected(sectionId, paramInfoId) {
  useSectionInfos.setState((x) => {
    const codeInfoChildren = getCodeInfoCol(sectionId, x).children;
    setAttrOfSelfAndDescendants(
      x.codeInfo,
      codeInfoChildren,
      paramInfoId,
      "isSelected",
      !x.codeInfo[paramInfoId].isSelected,
    );
  });
}

export function unselectAllParams() {
  let didUnselectSomeParams = false;
  useSectionInfos.setState((x) => {
    for (const codeInfo of Object.values(x.codeInfo)) {
      if (codeInfo.isSelected) {
        codeInfo.isSelected = false;
        didUnselectSomeParams = true;
      }
    }
  });
  return didUnselectSomeParams;
}

function setAttrOfSelfAndDescendants(state, codeInfoChildren, id, attr, value) {
  state[id][attr] = value;
  for (const paramId of codeInfoChildren[id]) {
    state[paramId][attr] = value;
    setAttrOfSelfAndDescendants(state, codeInfoChildren, paramId, attr, value);
  }
}

function getKwargIds(sectionId, codeInfoId, _state) {
  const state = _state ?? useSectionInfos.getState();
  const codeInfoChildren = getCodeInfoCol(sectionId, state).children;
  return codeInfoChildren[codeInfoId].filter((x) => state.codeInfo[x].editable);
}

export function getAllSelectedParamIds(sectionId, state) {
  const codeInfoState = state.codeInfo;
  const { selectedItem } = getSectionVariant(sectionId, state);
  const codeInfoChildren = getCodeInfoCol(sectionId, state).children;
  const { ids, pathMap } = findAllParametersAndPathMaps({
    allCodeInfo: codeInfoState,
    codeInfoChildren,
    startingId: selectedItem,
    additionalOutputCondition: (c) => c?.isSelected,
  });
  return { ids, pathMap };
}
