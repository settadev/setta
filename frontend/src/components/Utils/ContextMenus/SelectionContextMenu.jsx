import { Item } from "components/Utils/atoms/dropdown/item";
import { screenToFlowPosition } from "forks/xyflow/core/hooks/useViewportHelper";
import { useReactFlow } from "forks/xyflow/core/store";
import _ from "lodash";
import { clearActiveSectionIds } from "state/actions/activeSections";
import { closeAllContextMenus } from "state/actions/contextMenus";
import { deleteSections } from "state/actions/sections/deleteSections";
import { createGroup } from "state/actions/sections/groupSections";
import { maybeIncrementProjectStateVersion } from "state/actions/undo";
import { useContextMenus, useSectionInfos } from "state/definitions";
import { ContextMenuCore } from "./ContextMenuCore";

export function SelectionContextMenu() {
  const { isOpen, x, y, nodeIds } = useContextMenus(
    (x) => x.selection,
    _.isEqual,
  );

  const allLocked = useSectionInfos((x) =>
    nodeIds.map((n) => x.x[n].positionAndSizeLocked).every((p) => p),
  );

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

  const lockItem = allLocked
    ? "Unlock Position & Size"
    : "Lock Position & Size";

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
    </ContextMenuCore>
  );
}
