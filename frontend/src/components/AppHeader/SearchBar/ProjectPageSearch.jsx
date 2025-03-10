import { useOverviewListing } from "components/Panes/Overview/ProjectOverview";
import { StandardSearch } from "components/Utils/atoms/search/StandardSearch";
import {
  ComboboxItems,
  ComboboxList,
} from "components/Utils/Combobox/ComboboxParts";
import { useIdNameCombobox } from "components/Utils/Combobox/useIdNameCombobox";
import { getFloatingBoxHandlers } from "components/Utils/FloatingBox";
import _ from "lodash";
import React, { useRef } from "react";
import { addSectionInEmptySpace } from "state/actions/sections/createSections";
import { useCreateSectionsList } from "state/actions/sections/createSectionsHelper";
import { goToSection } from "state/actions/sections/sectionPositions";
import { maybeIncrementProjectStateVersion } from "state/actions/undo";
import {
  useProjectSearch,
  useSectionInfos,
  useSettings,
} from "state/definitions";
import { useUpdateProjectSearch } from "state/hooks/search";
import { focusOnSection } from "utils/tabbingLogic";
import { shortcutPrettified } from "utils/utils";

export function ProjectPageSearchBar() {
  return (
    <ProjectPageSearchBarWrapper>
      <ProjectPageSearchInput />
    </ProjectPageSearchBarWrapper>
  );
}

function ProjectPageSearchBarWrapper({ children }) {
  const mode = useProjectSearch((x) => x.mode);

  switch (mode) {
    case "find":
      return <ProjectPageFind>{children}</ProjectPageFind>;
    case "advanced":
      return <ProjectPageAdvanced>{children}</ProjectPageAdvanced>;
    case "commandPalette":
      return <ProjectPageCommandPalette>{children}</ProjectPageCommandPalette>;
    default:
      return null;
  }
}

function ProjectPageSearchInputComponent(props, ref) {
  const shortcuts = useSettings((x) => {
    return {
      advancedkey: shortcutPrettified(x.shortcuts.advancedSearchShortcut),
      commandkey: shortcutPrettified(x.shortcuts.commandPaletteShortcut),
    };
  }, _.isEqual);

  return (
    <StandardSearch
      outerClasses="self-center w-[clamp(1rem,_30vw,_30rem)] ml-4"
      inputStyles="flex-grow w-full cursor-auto overflow-hidden bg-setta-100 dark:bg-setta-950  hover:bg-white outline-offset-2 focus:bg-white rounded-full text-xs text-setta-900 dark:text-setta-200 focus-visible:outline outline-blue-500 pl-7 py-1 placeholder-setta-300 dark:placeholder-setta-600"
      leftElementStyles="pl-1"
      placeholder={`Search (${shortcuts.advancedkey}) / Create (${shortcuts.commandkey})`}
      {...props}
      ref={ref}
      {...getFloatingBoxHandlers({
        content: "Search your entire project from one location.",
      })}
      id="ProjectPageSearchBar"
    />
  );
}
const ProjectPageSearchInput = React.forwardRef(
  ProjectPageSearchInputComponent,
);

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
  function onSelectedItemChange(id) {
    goToSection(id);
    focusOnSection(null, id, false);
  }

  return (
    <ProjectPageAdvancedCore
      allItems={allItems}
      onSelectedItemChange={onSelectedItemChange}
    >
      {children}
    </ProjectPageAdvancedCore>
  );
}

function ProjectPageCommandPalette({ children }) {
  const allItems = useCreateSectionsList();
  // adds id to each item
  // TODO: make this less bad
  for (const g of allItems) {
    for (const item of g.items) {
      item.id = item.name;
    }
  }

  function onSelectedItemChange(id) {
    // finds matching item, and then uses its specificProps
    // TODO: make this less bad
    let match = null;
    for (const g of allItems) {
      for (const item of g.items) {
        if (item.id === id) {
          match = item;
          break;
        }
      }
    }

    if (!match) {
      return;
    }

    // get corresponding item and its section props
    useSectionInfos.setState((state) => {
      addSectionInEmptySpace({
        state,
        ...match.specificProps,
      });
    });
    maybeIncrementProjectStateVersion(true);
  }

  return (
    <ProjectPageAdvancedCore
      allItems={allItems}
      onSelectedItemChange={onSelectedItemChange}
    >
      {children}
    </ProjectPageAdvancedCore>
  );
}

function ProjectPageAdvancedCore({ allItems, onSelectedItemChange, children }) {
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
    clearInputAfterSelection: true,
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
