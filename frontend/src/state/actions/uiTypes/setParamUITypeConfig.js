import C from "constants/constants.json";
import {
  cloneNewUIType,
  maybeGetExistingUIType,
} from "state/actions/uiTypes/cloneUITypes";
import { useSectionInfos } from "state/definitions";
import { getParamUIType } from "state/hooks/uiTypes";
import { getValueForUIType } from "utils/objs/ev";
import { setEnteredValue } from "../sectionInfos";
import { setParamUITypeId } from "./setParamUITypeId";
import { setOneUITypeConfig } from "./uiTypes";

export function setParamUITypeConfig({ sectionId, paramInfoId, configProps }) {
  useSectionInfos.setState((state) => {
    const { uiTypeId, oldUITypeId } = maybeCloneParamUIType(
      sectionId,
      paramInfoId,
      state,
    );
    setOneUITypeConfig({ uiTypeId, ...configProps, state });
    if (uiTypeId !== oldUITypeId) {
      setParamUITypeId({ uiTypeId, sectionId, paramInfoId, state });
    }
    updateEVs(uiTypeId, configProps.configName, state);
  });
}

function maybeCloneParamUIType(sectionId, paramInfoId, state) {
  const defaultName = state.codeInfo[paramInfoId].name;
  const { uiTypeColId } = state.x[sectionId];
  const nonPresetUITypeIds =
    state.uiTypeCols[uiTypeColId][paramInfoId].nonPresetUITypeIds;
  const currUIType = getParamUIType(sectionId, paramInfoId, state);
  const existingUIType = maybeGetExistingUIType({
    currUIType,
    nonPresetUITypeIds,
    state,
  });
  if (existingUIType) {
    return {
      uiTypeId: existingUIType.id,
      oldUITypeId: currUIType.id,
    };
  }
  const newUIType = createNonPresetForParam({
    uiTypeColId,
    paramInfoId,
    currUIType,
    defaultName,
    state,
  });
  return {
    uiTypeId: newUIType.id,
    oldUITypeId: currUIType.id,
  };
}

function createNonPresetForParam({
  uiTypeColId,
  paramInfoId,
  currUIType,
  defaultName,
  state,
}) {
  const newUIType = cloneNewUIType({
    uiType: currUIType,
    name: defaultName,
  });
  state.uiTypes[newUIType.id] = newUIType;
  state.uiTypeCols[uiTypeColId][paramInfoId].nonPresetUITypeIds.push(
    newUIType.id,
  );
  return newUIType;
}

function updateEVs(uiTypeId, configName, state) {
  const uiType = state.uiTypes[uiTypeId];
  if (uiType.type === C.SLIDER && ["min", "max"].includes(configName)) {
    _updateEVs(uiType, state);
  }
}

function _updateEVs(uiType, state) {
  const { variants, uiTypeCols } = state;
  for (const [colId, col] of Object.entries(uiTypeCols)) {
    const paramsWithUITypeId = new Set();
    for (const [pid, p] of Object.entries(col)) {
      if (p.uiTypeId === uiType.id) {
        paramsWithUITypeId.add(pid);
      }
    }
    if (paramsWithUITypeId.size === 0) {
      continue;
    }

    for (const s of Object.values(state.x)) {
      if (s.uiTypeColId === colId) {
        const variantId = s.variantId;
        for (const [pid, valueInfo] of Object.entries(
          variants[variantId].values,
        )) {
          if (paramsWithUITypeId.has(pid)) {
            const newVal = getValueForUIType({
              uiType,
              currValue: valueInfo.value,
            });
            if (newVal !== valueInfo.value) {
              setEnteredValue(variantId, pid, newVal, state);
            }
          }
        }
      }
    }
  }
}
