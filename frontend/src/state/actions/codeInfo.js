import C from "constants/constants.json";
import _ from "lodash";
import { createNewId } from "utils/idNameCreation";
import { newCodeInfo } from "utils/objs/codeInfo";
import { newCodeInfoCol } from "utils/objs/codeInfoCol";
import { getCodeInfoCol, getSectionVariant } from "./sectionInfos";

export function addCodeInfo({ sectionId, info, parent, insertIdx, state }) {
  state.codeInfo[info.id] = info;
  const variant = getSectionVariant(sectionId, state);
  const currCodeInfoCol = getOrCreateCodeInfoCol(variant, state);
  if (!(parent in currCodeInfoCol.children)) {
    currCodeInfoCol.children[parent] = [];
  }

  if (_.isNil(insertIdx)) {
    currCodeInfoCol.children[parent].push(info.id);
  } else {
    currCodeInfoCol.children[parent].splice(insertIdx, 0, info.id);
  }
  currCodeInfoCol.children[info.id] = [];
}

export function deleteCodeInfo(sectionId, ids, state) {
  const variant = getSectionVariant(sectionId, state);
  const codeInfoCol = getOrCreateCodeInfoCol(variant, state);
  for (const parentId of Object.keys(codeInfoCol.children)) {
    codeInfoCol.children[parentId] = codeInfoCol.children[parentId].filter(
      (y) => !ids.includes(y),
    );
  }

  codeInfoCol.children = _.omit(codeInfoCol.children, ids);

  const { variantId, uiTypeColId } = state.x[sectionId];
  state.variants[variantId].values = _.omit(
    state.variants[variantId].values,
    ids,
  );
  state.uiTypeCols[uiTypeColId] = _.omit(state.uiTypeCols[uiTypeColId], ids);

  for (const s of state.variants[variantId].sweep) {
    s.params = s.params.filter((y) => !ids.includes(y.paramInfoId));
  }
}

export function getOrCreateCodeInfoCol(variant, state) {
  let codeInfoColId = variant.codeInfoColId;
  if (!codeInfoColId) {
    codeInfoColId = createNewId();
    variant.codeInfoColId = codeInfoColId;
    state.codeInfoCols[codeInfoColId] = newCodeInfoCol();
  }

  return state.codeInfoCols[codeInfoColId];
}

export function newCodeInfoMaybeWithJsonSource(sectionId, state) {
  return newCodeInfo({
    id: createNewId(),
    rcType: C.PARAMETER,
    editable: true,
    jsonSource: state.x[sectionId].jsonSource,
  });
}

export function getParamPath(sectionId, paramName, parentId, state) {
  const path = [paramName];
  while (parentId) {
    const info = state.codeInfo[parentId];
    if (info.rcType === C.PARAMETER) {
      path.push(info.name);
      parentId = getCodeInfoParentId(sectionId, parentId, state);
    } else {
      break;
    }
  }

  path.reverse();
  return path;
}

export function getCodeInfoParentId(sectionId, codeInfoId, state) {
  const codeInfoCol = getCodeInfoCol(sectionId, state);
  for (const [cid, children] of Object.entries(codeInfoCol.children)) {
    if (children.includes(codeInfoId)) {
      if (cid === "null") {
        return null;
      }
      return cid;
    }
  }
  return null;
}
