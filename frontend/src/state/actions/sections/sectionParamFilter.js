import { useActiveSection, useProjectSearch } from "state/definitions";

export function focusOnSearch() {
  const sectionIds = useActiveSection.getState().ids;
  if (sectionIds.length === 1) {
    const element = document.getElementById(`${sectionIds[0]}-args-filter`);
    if (element) {
      element.focus({ preventScroll: true });
    }
    return;
  }

  useProjectSearch.setState({ mode: "find" });
  // wait for re-render, otherwise the search bar re-renders after focusing on it
  requestAnimationFrame(() => {
    const element = document.getElementById("ProjectPageSearchBar");
    if (element) {
      element.focus({ preventScroll: true });
    }
  });
}

export function focusOnAdvancedSearch() {
  useProjectSearch.setState({ mode: "advanced" });
  // wait for re-render, otherwise the search bar re-renders after clicking on it
  requestAnimationFrame(() => {
    const element = document.getElementById("ProjectPageSearchBar");
    if (element) {
      element.click();
    }
  });
}
