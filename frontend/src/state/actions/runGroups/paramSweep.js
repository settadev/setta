import { useSectionInfos } from "state/definitions";

export function addParamSweepCallable(variantId) {
  useSectionInfos.setState((state) => {
    state.variants[variantId].sweep.push({ selectedItem: null, params: [] });
  });
}

export function setParamSweepValue({
  variantId,
  selectedItemIdx,
  paramIdx,
  valueIdx,
  value,
}) {
  useSectionInfos.setState((state) => {
    state.variants[variantId].sweep[selectedItemIdx].params[paramIdx].values[
      valueIdx
    ] = value;
  });
}

export function addParamSweepValue({ variantId, selectedItemIdx, paramIdx }) {
  useSectionInfos.setState((state) => {
    state.variants[variantId].sweep[selectedItemIdx].params[
      paramIdx
    ].values.push("");
  });
}

export function deleteParamSweepValue({
  variantId,
  selectedItemIdx,
  paramIdx,
  valueIdx,
}) {
  useSectionInfos.setState((state) => {
    const s = state.variants[variantId].sweep[selectedItemIdx];
    s.params[paramIdx].values = s.params[paramIdx].values.filter(
      (_, idx) => idx !== valueIdx,
    );
    if (s.params[paramIdx].values.length === 0) {
      s.params = s.params.filter((_, idx) => idx !== paramIdx);
    }
  });
}

export function deleteLastParamSweepValue({
  variantId,
  selectedItemIdx,
  paramIdx,
}) {
  const valueIdx =
    useSectionInfos.getState().variants[variantId].sweep[selectedItemIdx]
      .params[paramIdx].values.length - 1;
  deleteParamSweepValue({
    variantId,
    selectedItemIdx,
    paramIdx,
    valueIdx,
  });
}

export function changeParamSweepParamInfoId({
  variantId,
  selectedItemIdx,
  paramIdx,
  paramInfoId,
}) {
  useSectionInfos.setState((state) => {
    state.variants[variantId].sweep[selectedItemIdx].params[paramIdx] = {
      paramInfoId,
      values: [],
    };
  });
}

export function addParamSweepParamInfoId({
  variantId,
  selectedItemIdx,
  paramInfoId,
}) {
  let actualSelectedItemIdx = selectedItemIdx;
  if (actualSelectedItemIdx === null) {
    // special case for a section without callables
    // that has no params yet.
    addParamSweepCallable(variantId);
    actualSelectedItemIdx = 0;
  }

  useSectionInfos.setState((state) => {
    state.variants[variantId].sweep[actualSelectedItemIdx].params.push({
      paramInfoId,
      values: [],
    });
  });
}

export function deleteLastParamSweepParamInfoId({
  variantId,
  selectedItemIdx,
}) {
  if (selectedItemIdx === null) {
    // special case for a section without callables
    // that has no params yet.
    return;
  }
  useSectionInfos.setState((state) => {
    const s = state.variants[variantId];
    if (s.sweep[selectedItemIdx].params.length === 0) {
      s.sweep = s.sweep.filter((_, idx) => idx !== selectedItemIdx);
    } else {
      s.sweep[selectedItemIdx].params.pop();
    }
  });
}
