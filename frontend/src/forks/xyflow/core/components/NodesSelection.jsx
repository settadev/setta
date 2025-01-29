import cc from "classcat";
import useDrag from "forks/xyflow/core/hooks/useDrag";
import { useReactFlow } from "forks/xyflow/core/store";
import _ from "lodash";
import React, { useEffect, useRef } from "react";
import { openSelectionContextMenu } from "state/actions/contextMenus";
import { getNodes } from "state/actions/nodeInternals";
import { useActiveSection } from "state/definitions";
import { NO_PAN_CLASS_NAME } from "utils/constants";
import { updatePositions } from "../hooks/useUpdateNodePositions";
import { arrowKeyDiffs } from "./wrapNode";

function _NodesSelection({ x, y, width, height }) {
  const transformString = useReactFlow(
    (s) =>
      `translate(${s.transform[0]}px,${s.transform[1]}px) scale(${s.transform[2]})`,
  );
  const nodeRef = useRef(null);

  useEffect(() => {
    nodeRef.current?.focus({
      preventScroll: true,
    });
  }, []);

  useDrag({
    nodeRef,
  });

  const onContextMenu = (event) => {
    const activeSectionIds = useActiveSection.getState().ids;
    const selectedNodeIds = getNodes()
      .filter((n) => activeSectionIds.includes(n.id))
      .map((n) => n.id);
    openSelectionContextMenu(event, selectedNodeIds);
  };

  const onKeyDown = (event) => {
    if (Object.prototype.hasOwnProperty.call(arrowKeyDiffs, event.key)) {
      updatePositions({
        x: arrowKeyDiffs[event.key].x,
        y: arrowKeyDiffs[event.key].y,
        isShiftPressed: event.shiftKey,
      });
    }
  };

  return (
    <div
      className={cc([
        "react-flow__nodesselection",
        "react-flow__container",
        NO_PAN_CLASS_NAME,
      ])}
      style={{
        transform: transformString,
      }}
    >
      <div
        tabIndex={-1} //needed for onKeyDown to work
        ref={nodeRef}
        className="react-flow__nodesselection-rect"
        onContextMenu={onContextMenu}
        onKeyDown={onKeyDown}
        style={{
          width,
          height,
          top: y,
          left: x,
        }}
      />
    </div>
  );
}

function _NodesSelectionWrapper() {
  const nodesSelectionDims = useReactFlow(
    (s) => s.nodesSelectionDims,
    _.isEqual,
  );
  return nodesSelectionDims && <NodesSelection {...nodesSelectionDims} />;
}
const NodesSelection = React.memo(_NodesSelection);
export const NodesSelectionWrapper = React.memo(_NodesSelectionWrapper);
