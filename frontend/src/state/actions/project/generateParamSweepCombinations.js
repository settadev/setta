export function* generateParamSweepCombinations(input) {
  // First, group items by variantId for easier validation
  const sweepGroups = {};
  for (const item of input) {
    if (!sweepGroups[item.variantId]) {
      sweepGroups[item.variantId] = [];
    }
    sweepGroups[item.variantId].push(item);
  }

  // Helper generator function to yield combinations
  function* generateCombos(remainingSweepIds, pickedItems = [], current = {}) {
    if (remainingSweepIds.length === 0) {
      // Convert the grouped combinations back to array format
      const result = [];
      for (const [sweepAndItem, params] of Object.entries(current)) {
        for (const param of Object.values(params)) {
          result.push(param);
        }
      }
      yield result;
      return;
    }

    const sweepId = remainingSweepIds[0];
    const nextSweepIds = remainingSweepIds.slice(1);
    const items = sweepGroups[sweepId];

    // Try each item from this sweep group
    for (const item of items) {
      // Skip if we already used a different item from this sweep
      if (
        pickedItems.some(
          (picked) =>
            picked.variantId === item.variantId &&
            picked.selectedItem !== item.selectedItem,
        )
      ) {
        continue;
      }

      // Get all possible combinations of parameter values for this item
      const paramCombinations = [];
      const paramValues = {};

      // First, collect all possible values for each paramInfoId
      for (const param of item.params) {
        paramValues[param.paramInfoId] = param.values;
      }

      // Generate combinations for this variantId + selectedItem
      function generateParamCombos(paramIds, paramCurrent = {}) {
        if (paramIds.length === 0) {
          paramCombinations.push({ ...paramCurrent });
          return;
        }

        const paramId = paramIds[0];
        const remainingParamIds = paramIds.slice(1);

        for (const value of paramValues[paramId]) {
          paramCurrent[paramId] = {
            paramSweepSectionId: item.paramSweepSectionId,
            variantId: item.variantId,
            selectedItem: item.selectedItem,
            paramInfoId: paramId,
            value: value,
          };
          generateParamCombos(remainingParamIds, paramCurrent);
        }
      }

      generateParamCombos(Object.keys(paramValues));

      // Try each complete parameter combination for this item
      for (const paramCombo of paramCombinations) {
        const newCurrent = { ...current };
        const sweepAndItem = `${item.variantId}-${item.selectedItem}`;
        newCurrent[sweepAndItem] = paramCombo;

        yield* generateCombos(nextSweepIds, [...pickedItems, item], newCurrent);
      }
    }
  }

  // Start with all sweep IDs
  const sweepIds = Object.keys(sweepGroups);
  yield* generateCombos(sweepIds);
}
