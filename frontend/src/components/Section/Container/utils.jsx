import C from "constants/constants.json";
import { useDndChildren } from "forks/dnd-kit/dndChildren";
import { useReactFlow } from "forks/xyflow/core/store";
import {
  addActiveSectionIds,
  removeActiveSectionIds,
  setActiveSectionIds,
} from "state/actions/activeSections";
import { getHighestAncestor } from "state/actions/sectionInfos";
import { getSectionHasAtLeastOneSelectedParam } from "state/actions/sections/sectionContents";
import { setZIndices } from "state/actions/sections/sectionPositions";
import { useMisc, useSectionInfos } from "state/definitions";
import { SETTA_PREVENT_SECTION_ON_CLICK_TRIGGER } from "utils/constants";
import "./dndline.css";

export function getBgColor(sectionTypeName) {
  switch (sectionTypeName) {
    case C.CODE:
      return "bg-white dark:bg-setta-900";
    case C.TERMINAL:
      return "bg-setta-950 overflow-clip";
    case C.GLOBAL_PARAM_SWEEP:
      return "@container/multipane";
    // case PARAM_SWEEP:
    //   return "bg-setta-50 dark:bg-setta-850";
    case C.GLOBAL_VARIABLES:
      return "bg-white dark:bg-black";
    default:
      return "bg-setta-50 dark:bg-setta-860";
  }
}

export function getOutlineColor({
  jsonSourceMissing,
  isActiveSection,
  isGlobalVariables,
  isInOtherProjectConfigs,
}) {
  if (jsonSourceMissing) {
    return "outline-red-600 dark:outline-red-400";
  }
  if (isActiveSection && isGlobalVariables) {
    return "outline-green-600 dark:outline-turquoise-400";
  }
  if (isInOtherProjectConfigs) {
    if (isActiveSection) {
      return "outline-purple-600 dark:outline-purple-700";
    }
    return "outline-transparent [&:active:not(:has(button:active,:active.setta-prevent-section-active-css))]:outline-fuchsia-400";
  }

  if (isActiveSection) {
    return "outline-blue-600 dark:outline-blue-700";
  }

  return "outline-transparent [&:active:not(:has(button:active,:active.setta-prevent-section-active-css))]:outline-cyan-300";
}

export function getOnSectionClick(sectionId, isActiveSection) {
  return (e) => {
    if (
      e.target.closest(
        `button, [role="menuitem"], .${SETTA_PREVENT_SECTION_ON_CLICK_TRIGGER}`,
      ) ||
      isActuallyADrag()
    ) {
      // if a child button, menu item, or resizable is clicked,
      // or the click is actually a drag,
      // then don't "activate" the section
      return;
    }
    e.stopPropagation(); // to prevent parent section from becoming active
    if (useMisc.getState().mouseDownDrawArea) {
      useMisc.setState({ mouseDownDrawArea: false });
      return;
    }

    if (useMisc.getState().isSelectingParams) {
      // depends on bubbling behavior (child div onclicks get executed first)
      const atLeastOneParamSelected = getSectionHasAtLeastOneSelectedParam(
        sectionId,
        useSectionInfos.getState(),
      );
      if (!isActiveSection && atLeastOneParamSelected) {
        addActiveSectionIds([sectionId]);
      } else if (isActiveSection && !atLeastOneParamSelected) {
        removeActiveSectionIds([sectionId]);
      }
    } else if (useReactFlow.getState().multiSelectionActive) {
      if (isActiveSection) {
        removeActiveSectionIds([sectionId]);
      } else {
        addActiveSectionIds([sectionId]);
      }
    } else {
      setActiveSectionIds([sectionId]);
    }
    const highestAncestor = getHighestAncestor(sectionId);
    setZIndices([highestAncestor], false);
  };
}

export function useHasTempNested(sectionId) {
  return useDndChildren((x) => x.x[sectionId]?.length > 0);
}

function isActuallyADrag(minimumDelta = 5) {
  const { lastMouseDownLocation, lastMouseUpLocation } = useMisc.getState();

  if (!lastMouseDownLocation || !lastMouseUpLocation) {
    return false;
  }

  const deltaX = lastMouseUpLocation.x - lastMouseDownLocation.x;
  const deltaY = lastMouseUpLocation.y - lastMouseDownLocation.y;

  // Pythagorean theorem: a² + b² = c²
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

  return distance > minimumDelta;
}
