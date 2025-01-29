import { useCombobox } from "downshift";
import _ from "lodash";
import { matchSorter } from "match-sorter";
import { useState } from "react";
import useDeepCompareEffect from "use-deep-compare-effect";
import { flattenedItems } from "./utils";

function resetToPreviousVal(state) {
  return {
    selectedItem: state.selectedItem,
    inputValue: state.selectedItem === null ? "" : state.selectedItem.name,
  };
}

function getHighlightedIndex(items, selectedItem) {
  if (selectedItem) {
    let idx = 0;
    for (const group of items) {
      const currIdx = _.findIndex(group.items, selectedItem);
      if (currIdx !== -1) {
        return { highlightedIndex: idx + currIdx };
      }
      idx += group.items.length;
    }
  }
  return { highlightedIndex: -1 };
}

function getValueFromHighlightedIndex(latestItems, highlightedIndex) {
  if (highlightedIndex >= 0) {
    let idx = 0;
    for (const group of latestItems) {
      for (const item of group.items) {
        if (idx === highlightedIndex) {
          return { inputValue: item.name };
        }
        idx += 1;
      }
    }
  }
  return {};
}

function getExactMatch(latestItems, value, key) {
  return _.find(flattenedItems(latestItems), { [key]: value }) ?? null;
}

function getFirstMatch(latestItems) {
  return flattenedItems(latestItems)[0];
}

function getReducerModifications({ type, state, changes, items }) {
  const changeTypes = useCombobox.stateChangeTypes;

  switch (type) {
    case changeTypes.InputChange:
    case changeTypes.ToggleButtonClick:
      return getHighlightedIndex(items, changes.selectedItem);
    case changeTypes.InputKeyDownEscape:
    case changeTypes.InputBlur:
      return resetToPreviousVal(state);
    case changeTypes.InputKeyDownArrowUp:
    case changeTypes.InputKeyDownArrowDown:
      return getValueFromHighlightedIndex(items, changes.highlightedIndex);
    case changeTypes.InputKeyDownEnter:
      if (state.highlightedIndex !== -1) {
        return {};
      }
      // only do the following if no item is highlighted
      if (state.inputValue) {
        const objContainingValue = getFirstMatch(items);
        if (objContainingValue) {
          return {
            selectedItem: objContainingValue,
            inputValue: objContainingValue.name,
          };
        }
      }
      return resetToPreviousVal(state);
    default:
      return {};
  }
}

export function useComboboxStateReducerWithFilteredItems(
  allItems,
  value,
  setValue,
) {
  const [selection, setSelection] = useState(null);
  const [filteredItems, setFilteredItems] = useState(allItems);

  useDeepCompareEffect(() => {
    setFilteredItems(allItems);
    const objContainingValue = getExactMatch(allItems, value, "id");
    if (!_.isEqual(selection, objContainingValue)) {
      setSelection(objContainingValue);
    }
    // the following condition happens if the current selection is removed from the available options
    if (value && !objContainingValue) {
      setValue(null);
    }
  }, [allItems, value]);

  function stateReducer(state, actionAndChanges) {
    const { type, changes } = actionAndChanges;
    const changeTypes = useCombobox.stateChangeTypes;
    let latestItems = filteredItems;

    if (
      type === changeTypes.ItemClick ||
      type === changeTypes.InputClick ||
      type === changeTypes.ToggleButtonClick
    ) {
      // The user clicked on the search field, or the toggle button, or an item.
      // So show all search results. To understand why, imagine the user has previously selected
      // an item called "Slider". When the user revisits this combobox, we want them
      // to be able to see all the results, not just the ones that match "Slider..."
      // We don't want them to have to backspace just to see the full results.
      if (!_.isEqual(allItems, filteredItems)) {
        latestItems = allItems;
        setFilteredItems(latestItems);
      }
    } else if (type === changeTypes.InputChange) {
      // The user is typing, so filter the search results.
      // Or the combobox field is updated by external state, so also filter results in this case.
      if (changes.inputValue) {
        latestItems = allItems
          .map((group) => ({
            group: group.group,
            items: matchSorter(group.items, changes.inputValue, {
              keys: ["name"],
            }),
          }))
          .filter((group) => group.items.length > 0);
      } else {
        // if the inputValue is "", then show all items
        latestItems = allItems;
      }

      setFilteredItems(latestItems);
    }
    // else if (type === changeTypes.ControlledPropUpdatedSelectedItem) {
    //   // Call the callback when the input value is updated by us
    //   // (like when loading the project for the first time, the input field is populated with the saved selected item.)
    //   inputCallback?.(changes.inputValue);
    // }

    const mods = getReducerModifications({
      type,
      state,
      changes,
      items: latestItems,
    });

    return { ...changes, ...mods };
  }

  return { filteredItems, stateReducer, selection };
}
