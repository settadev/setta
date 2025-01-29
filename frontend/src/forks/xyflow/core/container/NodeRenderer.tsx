import { NodeWrapper } from "forks/xyflow/core/components/wrapNode";
import { useReactFlow } from "forks/xyflow/core/store";
import { memo, useEffect, useMemo, useRef } from "react";
import {
  getNodes,
  getNodeUpdateInformation,
  updateNodeDimensions,
} from "state/actions/nodeInternals";
import { useActiveSection, useNodeInternals } from "state/definitions";
import { shallow } from "zustand/shallow";
import { computeReadyToBeVisible } from "../store/utils";
import { containerStyle } from "../styles";
import type { ReactFlowState } from "../types";

const selector = (s: ReactFlowState) => ({
  nodesDraggable: s.nodesDraggable,
  nodesFocusable: s.nodesFocusable,
  elementsSelectable: s.elementsSelectable,
  panActivationKeyPressed: s.panActivationKeyPressed,
});

const NodeRenderer = ({}) => {
  const {
    nodesDraggable,
    nodesFocusable,
    elementsSelectable,
    panActivationKeyPressed,
  } = useReactFlow(selector, shallow);
  // The getNodes selector has to use the "shallow" comparison
  // and not _.isEqual, otherwise it only re-renders every other update,
  // even though the MiniMap component uses the exact same hook and comparison fn
  // and rerenders on every update.
  // Tried debugging, could not figure out why.
  const nodes = useNodeInternals(getNodes, shallow);
  const readyToBeVisible = useReactFlow(computeReadyToBeVisible);
  const resizeObserverRef = useRef<ResizeObserver>();
  const activeSectionIds = useActiveSection((x) => x.ids);

  const resizeObserver = useMemo(() => {
    if (typeof ResizeObserver === "undefined") {
      return null;
    }

    const observer = new ResizeObserver((entries: ResizeObserverEntry[]) => {
      const updates = getNodeUpdateInformation(entries, true);
      updateNodeDimensions(updates);
    });

    resizeObserverRef.current = observer;

    return observer;
  }, []);

  useEffect(() => {
    return () => {
      resizeObserverRef?.current?.disconnect();
    };
  }, []);

  return (
    <div className="react-flow__nodes" style={containerStyle}>
      {nodes.map((node) => {
        const isDraggable = !!(
          !panActivationKeyPressed &&
          (node.draggable ||
            (nodesDraggable && typeof node.draggable === "undefined"))
        );
        const isSelectable = !!(
          !panActivationKeyPressed &&
          (node.selectable ||
            (elementsSelectable && typeof node.selectable === "undefined"))
        );
        const isFocusable = !!(
          node.focusable ||
          (nodesFocusable && typeof node.focusable === "undefined")
        );

        const posX = node.position?.x ?? 0;
        const posY = node.position?.y ?? 0;

        return (
          <NodeWrapper
            key={node.id}
            id={node.id}
            style={node.style}
            xPos={posX}
            yPos={posY}
            selected={activeSectionIds.includes(node.id)}
            isDraggable={isDraggable}
            isSelectable={isSelectable}
            isFocusable={isFocusable}
            resizeObserver={resizeObserver}
            zIndex={node.tempZIndex}
            visibility={readyToBeVisible ? "visible" : "hidden"}
          />
        );
      })}
    </div>
  );
};

NodeRenderer.displayName = "NodeRenderer";

export default memo(NodeRenderer);
