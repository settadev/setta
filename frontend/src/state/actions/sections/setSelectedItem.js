import C from "constants/constants.json";
import { dbParametersRequest } from "requests/sections";
import { useSectionInfos } from "state/definitions";
import { newCodeInfo } from "utils/objs/codeInfo";
import { addCodeInfo } from "../codeInfo";
import { setParametersRequestWaitingForLSP } from "../lsp";
import { addTemporaryNotification } from "../notifications";
import { getCodeInfoCol, getSectionVariant } from "../sectionInfos";
import { maybeIncrementProjectStateVersion } from "../undo";

export async function setSelectedItem(
  dataSectionId,
  visualSectionId,
  selectedItemName,
  callbackSetAttr,
  refetchParams = false,
) {
  if (
    !refetchParams &&
    itemIsAlreadySelected(dataSectionId, selectedItemName)
  ) {
    useSectionInfos.setState((state) => {
      callbackSetAttr(undefined, state);
    });
    return;
  }
  const prevSelected = itemHasBeenSelectedBefore(
    dataSectionId,
    selectedItemName,
  );

  if (!refetchParams && prevSelected !== undefined) {
    useSectionInfos.setState((state) => {
      callbackSetAttr(prevSelected, state);
    });
    return;
  }

  const setToNotWaiting = setParametersRequestWaitingForLSP(visualSectionId);

  const paramRes = await dbParametersRequest({
    sectionId: dataSectionId,
    fullText: selectedItemName,
    position: selectedItemName.length,
  });

  useSectionInfos.setState((state) => {
    let info;
    if (!prevSelected) {
      info = newCodeInfo({
        name: selectedItemName,
        editable: false,
        rcType: C.CALLABLE,
        evRefs: paramRes.otherData.evRefs,
      });
      addCodeInfo({ sectionId: dataSectionId, info, parent: null, state });
    } else {
      info = state.codeInfo[prevSelected];
    }

    if (paramRes.data) {
      const [documentation, params] = paramRes.data;
      if (params) {
        createChildrenCodeInfo(dataSectionId, info.id, params, state);
      } else {
        addTemporaryNotification("No parameters found");
      }
      state.codeInfo[info.id].description = documentation;
    } else {
      addTemporaryNotification("No parameters found");
    }
    setToNotWaiting();
    callbackSetAttr(info.id, state);
  });

  maybeIncrementProjectStateVersion(true);
}

function createChildrenCodeInfo(sectionId, parent, params, state) {
  const existingChildrenNameToId = {};
  for (const c of getCodeInfoCol(sectionId, state)?.children?.[parent] ?? []) {
    existingChildrenNameToId[state.codeInfo[c].name] = c;
  }

  const paramIdsInOrder = [];
  for (const p of params) {
    // if the param name is already a child of parent, then get its id
    // otherwise it'll be undefined and id will be created in newCodeInfo
    const existingId = existingChildrenNameToId[p.name];
    const info = newCodeInfo({
      id: existingId,
      name: p.name,
      editable: false,
      rcType: C.PARAMETER,
      defaultVal: p.defaultVal,
      description: p.description,
      passingStyle: p.passingStyle,
    });
    paramIdsInOrder.push(info.id);
    if (!existingId) {
      addCodeInfo({ sectionId, info, parent, state });
    } else {
      state.codeInfo[existingId] = info;
    }
  }

  // ensures the params are in the right order, regardless of whether we are
  // creating new children, or updating existing ones.
  getCodeInfoCol(sectionId, state).children[parent] = paramIdsInOrder;
}

function itemHasBeenSelectedBefore(sectionId, selectedItemName) {
  // empty value is equivalent to the "null" callable id
  if (selectedItemName === "") {
    return null;
  }
  const state = useSectionInfos.getState();
  const codeInfoChildren = getCodeInfoCol(sectionId, state).children;
  for (const c of codeInfoChildren[null]) {
    if (state.codeInfo[c].name === selectedItemName) {
      return c;
    }
  }
  return undefined;
}

function itemIsAlreadySelected(sectionId, selectedItemName) {
  const state = useSectionInfos.getState();
  const currSelectedItem = getSectionVariant(sectionId, state).selectedItem;
  return state.codeInfo[currSelectedItem]?.name === selectedItemName;
}
