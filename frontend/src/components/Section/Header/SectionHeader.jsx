import { IconButton } from "components/Utils/atoms/buttons/IconButton";
import { StandardPopover } from "components/Utils/atoms/popover/standardpopover";
import C from "constants/constants.json";
import React from "react";
import { TbSortDescending2 } from "react-icons/tb";
import { deleteSections } from "state/actions/sections/deleteSections";
import { maybeIncrementProjectStateVersion } from "state/actions/undo";
import { useSectionInfos } from "state/definitions";
import { useIsSeriesElement } from "state/hooks/uiTypes";
import { Incrementer } from "../SectionParts/Incrementer";
import { CustomCloseButton } from "./CustomCloseButton";
import { LockPositionButton } from "./LockPositionButton";
import MenuButton from "./MenuButton/MenuButton";
import { MinimizeButton } from "./MinimizeButton";
import { RunButton } from "./RunButton";
import { SectionTitle } from "./SectionTitle";
import { ToggleRunInMemoryButton } from "./ToggleRunInMemoryButton";

function _SectionHeader({
  sectionId,
  isActiveSection,
  sectionTypeName,
  isInOtherProjectConfigs,
  isRoot,
}) {
  const onCustomCloseButtonClick = () => {
    useSectionInfos.setState((state) => {
      deleteSections([sectionId], state);
    });
    maybeIncrementProjectStateVersion(true);
  };

  const isSeriesElement = useIsSeriesElement(sectionId) && !isRoot;

  // DOM: maybe get rid of the extra div under header?

  return (
    <header className="section-title mx-2 flex flex-row items-center">
      <MenuButton
        sectionId={sectionId}
        sectionTypeName={sectionTypeName}
        isInOtherProjectConfigs={isInOtherProjectConfigs}
      />
      <MaybeCardTitle
        sectionId={sectionId}
        isActiveSection={isActiveSection}
        isInOtherProjectConfigs={isInOtherProjectConfigs}
        sectionTypeName={sectionTypeName}
      />
      <div className="z-10 ml-auto flex items-center">
        {isSeriesElement && (
          <StandardPopover
            arrowClasses="fill-white dark:fill-setta-800"
            contentClasses="z-20"
            trigger={
              <IconButton
                twClasses="[&_*]:hover:text-setta-500 [&_*]:dark:hover:text-setta-400"
                bg="bg-transparent"
              >
                <TbSortDescending2 className="text-setta-300 dark:text-setta-700" />
              </IconButton>
            }
          >
            <Incrementer sectionId={sectionId} isRoot={isRoot} popover={true} />
          </StandardPopover>
        )}
        {sectionTypeName === C.CODE && (
          <>
            <RunButton sectionId={sectionId} />{" "}
            <ToggleRunInMemoryButton sectionId={sectionId} />{" "}
          </>
        )}
        <LockPositionButton sectionId={sectionId} />
        {!isRoot && <MinimizeButton sectionId={sectionId} />}
        <CustomCloseButton onClick={onCustomCloseButtonClick} />
      </div>
    </header>
  );
}

export const SectionHeader = React.memo(_SectionHeader);

function MaybeCardTitle({
  sectionId,
  isActiveSection,
  isInOtherProjectConfigs,
  sectionTypeName,
}) {
  return sectionTypeName === C.TEXT_BLOCK ? (
    <TextBlockCardTitle
      sectionId={sectionId}
      isActiveSection={isActiveSection}
      isInOtherProjectConfigs={isInOtherProjectConfigs}
      sectionTypeName={sectionTypeName}
    />
  ) : (
    <SectionTitle
      sectionId={sectionId}
      titleProps={getTitleStyles({
        isActiveSection,
        isInOtherProjectConfigs,
        sectionTypeName,
      })}
    />
  );
}

function TextBlockCardTitle({
  sectionId,
  isActiveSection,
  isInOtherProjectConfigs,
  sectionTypeName,
}) {
  const headingAsSectionName = useSectionInfos(
    (x) => x.x[sectionId].headingAsSectionName,
  );

  return (
    !headingAsSectionName && (
      <SectionTitle
        sectionId={sectionId}
        titleProps={getTitleStyles({
          isActiveSection,
          isInOtherProjectConfigs,
          sectionTypeName,
        })}
      />
    )
  );
}

function getTitleStyles({
  isActiveSection,
  isInOtherProjectConfigs,
  sectionTypeName,
}) {
  const editing =
    "cursor-text nodrag px-1 py-0 leading-5 -ml-1 bg-setta-100 focus-visible:ring-0 focus-visible:outline-none rounded-md box-border border border-solid border-transparent focus-visible:border-blue-500 dark:bg-setta-800 w-3/5 dark:text-white font-bold text-[.7rem] tracking-tight";

  const isGlobalVariables = sectionTypeName === C.GLOBAL_VARIABLES;

  const notEditing = getNotEditingStyle({
    isActiveSection,
    isInOtherProjectConfigs,
    isGlobalVariables,
    sectionTypeName,
  });

  if (isGlobalVariables) {
    return { fixed: notEditing };
  }

  const fixed =
    "select-none italic focus-visible:ring-0 focus-visible:outline-none box-border border border-solid border-transparent focus-visible:border-blue-500 tracking-tighter text-xs text-setta-400 max-w-full truncate pr-0.5";

  return { editing, notEditing, fixed };
}

function getNotEditingStyle({
  isActiveSection,
  isInOtherProjectConfigs,
  isGlobalVariables,
  sectionTypeName,
}) {
  let textColorClass = "";
  let fontClass = "font-bold";

  // Handle text color based on conditions
  if (isActiveSection) {
    if (isInOtherProjectConfigs) {
      textColorClass = "text-purple-800 dark:text-purple-200";
    } else if (isGlobalVariables) {
      textColorClass = "text-green-800 dark:text-green-200";
    } else if (sectionTypeName === C.TERMINAL) {
      textColorClass = "text-blue-400";
    } else {
      textColorClass = "text-blue-600 dark:text-blue-400";
    }
  } else {
    if (sectionTypeName === C.TERMINAL) {
      textColorClass = "text-setta-300";
    } else {
      textColorClass = "text-setta-700 dark:text-setta-300";
    }
  }

  // Handle text case for global variables
  if (isGlobalVariables) {
    fontClass = "uppercase font-bold";
  }

  // Combine all the classes
  const baseClasses =
    "px-1 py-0 -ml-1 w-3/5 focus-visible:ring-0 focus-visible:outline-none box-border rounded-md border border-solid border-transparent focus-visible:border-blue-500 leading-5 font-bold tracking-tight cursor-pointer max-w-full text-[.7rem] truncate";

  return `${baseClasses} ${textColorClass} ${fontClass}`;
}
