import { localStorageFns } from "state/hooks/localStorage";

function toggleHelper(state) {
  const [value, setValue] = state;
  setValue(!value);
}

export function toggleDarkMode() {
  toggleHelper(localStorageFns.darkMode.state());
}

export function toggleMiniMap() {
  toggleHelper(localStorageFns.showMinimap.state());
}

export function toggleProjectConfigPreviewEnabled() {
  toggleHelper(localStorageFns.projectConfigPreviewEnabled.state());
}

export function toggleSnapToGrid() {
  toggleHelper(localStorageFns.snapToGrid.state());
}
