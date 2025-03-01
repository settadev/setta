import { Item } from "components/Utils/atoms/dropdown/item";
import { screenToFlowPosition } from "forks/xyflow/core/hooks/useViewportHelper";
import { useReactFlow } from "forks/xyflow/core/store";
import _ from "lodash";
import { clearActiveSectionIds } from "state/actions/activeSections";
import { closeAllContextMenus } from "state/actions/contextMenus";
import { getSectionVisibilityKey } from "state/actions/sectionInfos";
import { deleteSections } from "state/actions/sections/deleteSections";
import { createGroup } from "state/actions/sections/groupSections";
import { maybeIncrementProjectStateVersion } from "state/actions/undo";
import { useContextMenus, useSectionInfos } from "state/definitions";
import { VIEWING_EDITING_MODE } from "utils/constants";
import { ContextMenuCore } from "./ContextMenuCore";

export function SelectionContextMenu() {
  const { isOpen, x, y, nodeIds } = useContextMenus(
    (x) => x.selection,
    _.isEqual,
  );

  const { allVisible, allLocked, viewingEditingMode } = useSectionInfos((x) => {
    const { viewingEditingMode } = x.projectConfig;
    const visibilityKey = getSectionVisibilityKey(viewingEditingMode);
    const nodeMap = x.x;

    let allVisible = true;
    let allLocked = true;

    for (const id of nodeIds) {
      const node = nodeMap[id];
      if (!node.visibility[visibilityKey]) {
        allVisible = false;
      }

      if (!node.positionAndSizeLocked) {
        allLocked = false;
      }

      if (!allVisible && !allLocked) {
        break;
      }
    }

    return { allVisible, allLocked, viewingEditingMode };
  });

  const closeContextMenu = () => {
    closeAllContextMenus();
    useReactFlow.setState({ nodesSelectionDims: null });
  };

  function onClickCreate() {
    createGroup({
      nodeIds,
      ...screenToFlowPosition({ x, y }),
    });
    closeContextMenu();
  }

  function onClickDelete() {
    useSectionInfos.setState((state) => {
      deleteSections(nodeIds, state);
    });
    closeContextMenu();
    clearActiveSectionIds();
    maybeIncrementProjectStateVersion(true);
  }

  function onClickLock() {
    useSectionInfos.setState((state) => {
      for (const n of nodeIds) {
        state.x[n].positionAndSizeLocked = !allLocked;
      }
    });
    closeContextMenu();
  }

  function onClickVisibility() {
    useSectionInfos.setState((state) => {
      for (const n of nodeIds) {
        state.x[n].visibility[getSectionVisibilityKey(viewingEditingMode)] =
          !allVisible;
      }
    });
    closeContextMenu();
  }

  const lockItem = allLocked
    ? "Unlock Position & Size"
    : "Lock Position & Size";

  const visibilityItem = allVisible ? "Hide" : "Show";

  return (
    <ContextMenuCore
      x={x}
      y={y}
      isOpen={isOpen}
      closeContextMenu={closeContextMenu}
    >
      <Item onClick={onClickCreate}>Create Group</Item>
      <Item onClick={onClickDelete}>Delete</Item>
      <Item onClick={onClickLock}>{lockItem}</Item>
      {viewingEditingMode === VIEWING_EDITING_MODE.USER_EDIT && (
        <Item onClick={onClickVisibility}>{visibilityItem}</Item>
      )}
    </ContextMenuCore>
  );
}
