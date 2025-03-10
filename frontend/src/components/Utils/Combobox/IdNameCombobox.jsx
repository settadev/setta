import { useRef } from "react";
import { ComboboxInput, ComboboxItems, ComboboxList } from "./ComboboxParts";
import { useIdNameCombobox } from "./useIdNameCombobox";

// TODO: add "display groups" argument
export function IdNameCombobox({
  allItems,
  value,
  onSelectedItemChange,
  small,
  outerDivClasses = "",
  placeholder,
  bg,
  isDisabled,
  inputDivId,
  selectedItemCanBeNull,
  clearInputAfterSelection,
}) {
  const inputRef = useRef();

  const {
    isOpen,
    filteredItems,
    getToggleButtonProps,
    getMenuProps,
    getInputProps,
    highlightedIndex,
    getItemProps,
    itemToString,
    onKeyDown,
  } = useIdNameCombobox({
    allItems,
    onSelectedItemChange,
    value,
    selectedItemCanBeNull,
    clearInputAfterSelection,
  });

  return (
    <search
      className={`flex ${
        small ? "h-[20px]" : "h-8"
      } relative w-full min-w-0 flex-col items-stretch overflow-visible ${outerDivClasses}`}
    >
      <ComboboxInput
        divId={inputDivId}
        getInputProps={getInputProps}
        getToggleButtonProps={getToggleButtonProps}
        isOpen={isOpen}
        small={small}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        bg={bg}
        isDisabled={isDisabled}
        inputRef={inputRef}
      />

      <ComboboxList
        isOpen={isOpen}
        getMenuProps={getMenuProps}
        inputRef={inputRef}
      >
        <ComboboxItems
          filteredItems={filteredItems}
          getItemProps={getItemProps}
          highlightedIndex={highlightedIndex}
          itemToString={itemToString}
        />
      </ComboboxList>
    </search>
  );
}
