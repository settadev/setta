import { useOverviewListing } from "components/Panes/Overview/ProjectOverview";
import { StandardSearch } from "components/Utils/atoms/search/StandardSearch";
import {
  ComboboxItems,
  ComboboxList,
} from "components/Utils/Combobox/ComboboxParts";
import { useIdNameCombobox } from "components/Utils/Combobox/useIdNameCombobox";
import { getFloatingBoxHandlers } from "components/Utils/FloatingBox";
import React, { useRef } from "react";
import { goToSection } from "state/actions/sections/sectionPositions";
import { useProjectSearch } from "state/definitions";
import { useUpdateProjectSearch } from "state/hooks/search";
import { focusOnSection } from "utils/tabbingLogic";

export function ProjectPageSearchBar() {
  return (
    <ProjectPageSearchBarWrapper>
      <ProjectPageSearchInput />
    </ProjectPageSearchBarWrapper>
  );
}

function ProjectPageSearchBarWrapper({ children }) {
  const mode = useProjectSearch((x) => x.mode);

  if (mode === "find") {
    return <ProjectPageFind>{children}</ProjectPageFind>;
  }
  return <ProjectPageAdvanced>{children}</ProjectPageAdvanced>;
}

const ProjectPageSearchInput = React.forwardRef((props, ref) => {
  return (
    <StandardSearch
      outerClasses="self-center w-[clamp(10rem,_30vw,_15rem)]  ml-4"
      inputStyles="flex-grow cursor-auto overflow-hidden bg-setta-100 dark:bg-setta-950 border-setta-500 hover:bg-white outline-offset-2 focus:bg-white rounded-full text-xs text-setta-900 dark:text-setta-200 focus-visible:outline outline-blue-500 pl-7 py-1 placeholder-setta-300 dark:placeholder-setta-700"
      leftElementStyles="pl-1"
      placeholder="Search Project"
      {...props}
      ref={ref}
      {...getFloatingBoxHandlers({
        content: "Search your entire project from one location.",
      })}
      id="ProjectPageSearchBar"
    />
  );
});

function ProjectPageFind({ children }) {
  const { value, onChange, onBlur, onFocus, onKeyDown } =
    useUpdateProjectSearch();

  return React.cloneElement(children, {
    value,
    onChange,
    onBlur,
    onFocus,
    onKeyDown,
  });
}

function ProjectPageAdvanced({ children }) {
  const allSections = useOverviewListing();
  const allItems = [{ group: "Sections", items: allSections }];

  return (
    <ProjectPageAdvancedCore allItems={allItems}>
      {children}
    </ProjectPageAdvancedCore>
  );
}

function ProjectPageAdvancedCore({ allItems, children }) {
  function onSelectedItemChange(id) {
    goToSection(id);
    focusOnSection(null, id, false);
  }

  const {
    isOpen,
    filteredItems,
    // getToggleButtonProps,
    getMenuProps,
    getInputProps,
    highlightedIndex,
    getItemProps,
    itemToString,
    onKeyDown,
  } = useIdNameCombobox({
    allItems,
    onSelectedItemChange,
  });

  const inputRef = useRef();

  return (
    <>
      {React.cloneElement(children, {
        ...getInputProps({
          onKeyDown,
          ref: inputRef,
        }),
      })}

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
    </>
  );
}
