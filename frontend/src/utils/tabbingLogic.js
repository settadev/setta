import C from "constants/constants.json";
import { movePaneToIncludeElement } from "forks/xyflow/core/utils/graph";
import { getHighestAncestor, getSectionType } from "state/actions/sectionInfos";
import { useSectionRefs } from "state/definitions";
import { localStorageFns } from "state/hooks/localStorage";
import { HOME_ROUTER_PATH, pathRelativeToProject } from "./constants";

export function overviewPaneOnKeyDown(e) {
  if (e.code !== "Tab" || e.shiftKey) {
    return;
  }
  if (e.target === lastFocusableElement(e.currentTarget)) {
    tabToFirstEnabledUIEditorButtonOrToSiteLogo(e);
  }
}

export function uiEditorPaneOnKeyDown(e) {
  if (e.code !== "Tab" || e.shiftKey) {
    return;
  }
  if (e.target === lastFocusableElement(e.currentTarget)) {
    e.preventDefault();
    document.getElementById("SiteLogo").focus();
  }
}

export function siteLogoOnKeyDown(e, navigate, location) {
  if (location.pathname === HOME_ROUTER_PATH) {
    return;
  }
  if (e.code === "Space") {
    navigate(HOME_ROUTER_PATH);
  } else if (e.code === "Tab" && e.shiftKey) {
    tabToLastFocusablePaneElement(e);
  }
}

export function homePageProjectItemOnKeyDown(e, navigate, projectConfigName) {
  if (e.code === "Space") {
    navigate(pathRelativeToProject(projectConfigName));
  }
}

function withinSectionTabbingHelper(focusEl) {
  focusEl.focus({ preventScroll: true });
  movePaneToIncludeElement(focusEl);
}

export function sectionContainerCoreOnKeyDown(e, ref, sectionId) {
  if (e.code !== "Tab") {
    return;
  }
  e.preventDefault();
  e.stopPropagation();
  const highestAncestorRef =
    useSectionRefs.getState().withNested[getHighestAncestor(sectionId)];
  const focusableArray = getFocusableElements(highestAncestorRef);

  if (e.shiftKey) {
    const focusEl = getPrevElement(e, ref, focusableArray);
    if (!focusEl) {
      shiftTabBackToOverviewListItem(e, sectionId);
    } else {
      withinSectionTabbingHelper(focusEl);
    }
  } else {
    const focusEl = getNextElement(e, ref, focusableArray);
    if (!focusEl) {
      tabToFirstEnabledUIEditorButtonOrToSiteLogo(e);
    } else {
      withinSectionTabbingHelper(focusEl);
    }
  }
}

function getNextElement(e, ref, focusableArray) {
  if (e.target === ref.current) {
    return firstFocusableElement(ref.current);
  }
  return focusableArray[getCurrentElementIndex(e, focusableArray) + 1];
}

function getPrevElement(e, ref, focusableArray) {
  if (e.target === ref.current) {
    const firstElement = firstFocusableElement(ref.current);
    return focusableArray[focusableArray.indexOf(firstElement) - 1];
  }
  return focusableArray[getCurrentElementIndex(e, focusableArray) - 1];
}

function getCurrentElementIndex(e, focusableArray) {
  return e.target.cmView
    ? focusableArray.findIndex((f) => f.id.startsWith("CodeMirror-"))
    : focusableArray.indexOf(document.activeElement);
}

export function tabFromDocumentBody(e) {
  if (document.activeElement === document.body) {
    focusOnProjectOverviewButton(e);
  }
}

function tabToFirstEnabledUIEditorButtonOrToSiteLogo(e) {
  e.preventDefault();
  const element =
    firstFocusableElement(document.getElementById("UiEditorPane")) ??
    document.getElementById("SiteLogo");
  element.focus();
}

function tabToLastFocusablePaneElement(e) {
  e.preventDefault();
  const didFocus = focusOnLastElementOf(
    document.getElementById("UiEditorPane"),
  );
  if (!didFocus) {
    focusOnLastElementOf(document.getElementById("OverviewPane"));
  }
}

function focusOnLastElementOf(container) {
  const lastElement = lastFocusableElement(container);
  if (lastElement) {
    lastElement.focus();
    return true;
  }
  return false;
}

function focusOnProjectOverviewButton(e) {
  e.preventDefault();
  firstFocusableElement(document.getElementById("OverviewPane")).focus();
}

function shiftTabBackToOverviewListItem(e, sectionId) {
  const [overviewVis] = localStorageFns.overviewVis.state();
  const [overviewTab] = localStorageFns.overviewTab.state();
  if (overviewVis && overviewTab === "tab1") {
    e.preventDefault();
    const element = document.getElementById(`${sectionId}-OverviewListItem`);
    element.focus();
  } else {
    focusOnProjectOverviewButton(e);
  }
}

export function focusOnSection(e, sectionId, focusOnFirstElement = true) {
  e?.preventDefault();
  if (getSectionType(sectionId) === C.GROUP) {
    useSectionRefs
      .getState()
      .withNested[sectionId].focus({ preventScroll: true });
  } else {
    if (focusOnFirstElement) {
      firstFocusableElement(
        useSectionRefs.getState().selfOnly[sectionId],
      ).focus({ preventScroll: true });
    } else {
      // focus on withNested here because this allows
      // react-flow controls (like arrow key) to work
      useSectionRefs
        .getState()
        .withNested[sectionId].focus({ preventScroll: true });
    }
  }
}

const getFocusableElements = (container) => {
  return Array.from(
    container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"]):not([role="menubar"])',
    ),
  ).filter((element) => {
    // Check if the element is visible and not disabled
    return (
      !element.hasAttribute("disabled") &&
      !element.getAttribute("aria-hidden") &&
      element.offsetParent !== null
    );
  });
};

const lastFocusableElement = (container) => {
  const focusableElements = getFocusableElements(container);

  if (focusableElements.length === 0) {
    return null;
  }

  return focusableElements[focusableElements.length - 1];
};

const firstFocusableElement = (container) => {
  const focusableElements = getFocusableElements(container);

  if (focusableElements.length === 0) {
    return null;
  }

  return focusableElements[0];
};

export function focusOnSectionSearch(sectionId) {
  document.getElementById(`${sectionId}-search`).focus({ preventScroll: true });
}
