import { useCombobox } from "downshift";
import { useComboboxStateReducerWithFilteredItems } from "./ComboboxStateReducer";
import { flattenedItems } from "./utils";

export function useIdNameCombobox({
  allItems,
  onSelectedItemChange,
  value,
  selectedItemCanBeNull,
}) {
  function onKeyDown(e) {
    if (e.code === "Escape") {
      // TODO: figure out best way to blur without being annoying
      // e.target.blur();
    }
  }

  const itemToString = (x) => (x ? x.name : "");

  const { filteredItems, stateReducer, selection } =
    useComboboxStateReducerWithFilteredItems(
      allItems,
      value,
      onSelectedItemChange,
      selectedItemCanBeNull,
    );

  const localOnSelectedItemChange = ({ selectedItem }) => {
    onSelectedItemChange(selectedItem ? selectedItem.id : null);
  };

  const singleListItems = flattenedItems(filteredItems);

  const {
    isOpen,
    getToggleButtonProps,
    getMenuProps,
    getInputProps,
    highlightedIndex,
    getItemProps,
  } = useCombobox({
    stateReducer,
    selectedItem: selection,
    items: singleListItems,
    itemToString,
    onSelectedItemChange: localOnSelectedItemChange,
  });

  return {
    isOpen: isOpen && singleListItems.length > 0,
    filteredItems,
    getToggleButtonProps,
    getMenuProps,
    getInputProps,
    highlightedIndex,
    getItemProps,
    itemToString,
    onKeyDown,
  };
}
