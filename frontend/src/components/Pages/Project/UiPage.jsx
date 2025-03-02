import { PaneContextMenu } from "components/Utils/ContextMenus/PaneContextMenu";
import { SelectionContextMenu } from "components/Utils/ContextMenus/SelectionContextMenu";
import { TypeErrorContextMenu } from "components/Utils/ContextMenus/TypeErrorContextMenu";
import { GlobalDndContext } from "forks/dnd-kit/GlobalDndContext";
import ReactFlow from "forks/xyflow/core/container/ReactFlow";
import "forks/xyflow/core/styles/style.css";
import { useEffect } from "react";
import { attachKeyEventListeners } from "state/actions/keyActivations";
import { useMisc } from "state/definitions";
import { localStorageFns } from "state/hooks/localStorage";
import "./react-flow-css.css";
import { ResponsiveMiniMap } from "./ResponsiveMiniMap";

export function UIPage() {
  useInitGlobalKeyEventListeners();
  useLastMouseDownMouseUpLocation();
  const [showMiniMap] = localStorageFns.showMinimap.hook();

  return (
    <GlobalDndContext>
      <ReactFlow />
      <PaneContextMenu />
      <SelectionContextMenu />
      <TypeErrorContextMenu />
      {showMiniMap && <ResponsiveMiniMap />}
    </GlobalDndContext>
  );
}

function useInitGlobalKeyEventListeners() {
  useEffect(() => {
    const cleanup = attachKeyEventListeners();
    return cleanup;
  }, []);
}

function useLastMouseDownMouseUpLocation() {
  useEffect(() => {
    const handlePointerDown = (e) => {
      useMisc.setState({
        lastMouseDownLocation: { x: e.clientX, y: e.clientY },
      });
    };

    const handlePointerUp = (e) => {
      useMisc.setState({
        lastMouseUpLocation: { x: e.clientX, y: e.clientY },
      });
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("pointerup", handlePointerUp);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("pointerup", handlePointerUp);
    };
  }, []);
}
