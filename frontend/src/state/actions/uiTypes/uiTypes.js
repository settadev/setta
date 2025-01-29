import { useSectionInfos } from "state/definitions";

export function setOneUITypeConfig({
  uiTypeId,
  configName,
  newValueFn,
  state,
}) {
  const curr = state.uiTypes[uiTypeId].config;
  curr[configName] = newValueFn(curr[configName]);
}

export function deleteUIType(uiTypeId) {
  useSectionInfos.setState((state) => {
    delete state.uiTypes[uiTypeId];
  });
}
