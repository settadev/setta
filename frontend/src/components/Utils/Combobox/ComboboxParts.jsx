import { StandardSearch } from "components/Utils/atoms/search/StandardSearch";
import React, { useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { StandardSearchRightBtn } from "../atoms/search/StandardSearchRightBtn";

export function ComboboxInput({
  divId,
  getInputProps,
  getToggleButtonProps,
  isOpen,
  small,
  onKeyDown,
  placeholder,
  bg = "bg-white dark:bg-setta-900",
  isDisabled,
  inputRef,
}) {
  return (
    <StandardSearch
      inputStyles={`flex-grow truncate outline-0 cursor-auto ${bg} rounded-full text-xs font-mono text-setta-600 font-medium pl-3 pr-4 focus-visible:border-white dark:text-setta-300 dark:focus-visible:border-setta-900 focus-visible:ring-2 border border-solid border-setta-100 dark:border-setta-800 placeholder:text-setta-200 dark:placeholder:text-setta-700 min-w-0 ${
        small ? "h-4 my-auto" : "h-7"
      }`}
      noLeftElement={true}
      placeholder={placeholder}
      // leftElementStyles="pl-3"
      {...getInputProps({
        id: divId,
        onKeyDown,
        ref: inputRef,
        disabled: isDisabled,
      })}
      // rightElement={<i className="gg-spinner mr-1 text-blue-500/70" />}
      rightElement={
        <StandardSearchRightBtn
          {...getToggleButtonProps({
            disabled: isDisabled,
          })}
          icon={
            isOpen ? (
              <i className="gg-chevron-up mr-[5px] mt-[4px] !h-3 !w-3" />
            ) : (
              <i className="gg-chevron-down mb-[4px] mr-[5px] !h-3 !w-3" />
            )
          }
          size={small ? "w-4 h-4 !mr-[1px]" : "w-7 h-7"}
        />
      }
    />
  );
}

export function ComboboxList({ isOpen, children, getMenuProps, inputRef }) {
  const [listDims, setListDims] = useState({ x: 0, y: 0, width: 0 });
  const display = isOpen ? "flex" : "hidden";

  useLayoutEffect(() => {
    if (isOpen && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      const yMargin = -30;
      setListDims({
        x: rect.left,
        y: rect.bottom + yMargin,
        width: rect.width,
      });
    }
  }, [isOpen, inputRef]);

  return createPortal(
    <div
      className={`nowheel nodrag absolute w-fit pb-2 ${display} z-20 mt-8 max-h-96 rounded-md border bg-white shadow-xl dark:border-setta-700/70 dark:bg-setta-800 dark:text-setta-200 dark:shadow-setta-900/50`}
      {...getMenuProps()}
      style={{
        left: `${listDims.x}px`,
        top: `${listDims.y}px`,
        minWidth: listDims.width,
      }}
    >
      <div className="w-full overflow-y-scroll">{children}</div>
    </div>,
    document.body,
  );
}

function _ComboboxItem({
  getItemProps,
  item,
  index,
  isHighlighted,
  itemStyle = "",
  itemString,
}) {
  const bg = isHighlighted ? "bg-setta-300/50 dark:bg-setta-900/50" : "";
  return (
    <dd
      className={`mx-1 cursor-pointer truncate rounded-lg px-2 py-[.125rem] text-xs ${bg} ${itemStyle}`}
      {...getItemProps({ item, index })}
    >
      {itemString}
    </dd>
  );
}

const ComboboxItem = React.memo(_ComboboxItem);

export function ComboboxItems({
  filteredItems,
  getItemProps,
  highlightedIndex,
  itemToString,
}) {
  return filteredItems.reduce(
    (result, group, groupIndex) => {
      result.groups.push(
        <dl key={groupIndex}>
          <dt className="mx-3 mb-1 truncate border-b border-solid border-setta-300/50 pt-3 text-[0.6rem] font-bold uppercase text-setta-400 first:pt-2">
            {group.group}
          </dt>
          {group.items.map((item, itemIndex) => {
            const globalIndex = result.itemIndex++;
            return (
              <ComboboxItem
                getItemProps={getItemProps}
                item={item}
                index={globalIndex}
                isHighlighted={globalIndex === highlightedIndex}
                itemString={itemToString ? itemToString(item) : item}
                key={itemIndex}
              />
            );
          })}
        </dl>,
      );

      return result;
    },
    { groups: [], itemIndex: 0 },
  ).groups;
}
