import { useContextMenus } from "state/definitions";
import { NO_CONTEXT_MENU } from "utils/constants";

function openContextMenu(e, name, props) {
  if (NO_CONTEXT_MENU) {
    return;
  }
  e.preventDefault();
  const val = { isOpen: true, x: e.clientX, y: e.clientY, ...props };
  useContextMenus.setState((state) => ({ [name]: { ...state[name], ...val } }));
}

export function openPaneContextMenu(e) {
  openContextMenu(e, "pane");
}

export function openSelectionContextMenu(e, nodeIds) {
  openContextMenu(e, "selection", { nodeIds });
}

export function closeAllContextMenus() {
  useContextMenus.getState().reset();
}
