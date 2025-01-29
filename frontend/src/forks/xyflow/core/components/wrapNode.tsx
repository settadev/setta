import cc from "classcat";
import { SectionContainer } from "components/Section/Container/SectionContainer";
import { useFloatingBox } from "components/Utils/FloatingBox";
import type { KeyboardEvent } from "react";
import { memo, useEffect, useRef } from "react";
import { useSectionInfos } from "state/definitions";
import {
  NO_PAN_CLASS_NAME,
  SETTA_PREVENT_ARROW_KEYS_MOVING_SECTION,
} from "utils/constants";
import useDrag from "../hooks/useDrag";
import { updatePositions } from "../hooks/useUpdateNodePositions";
import type { WrapNodeProps, XYPosition } from "../types";
import { isInputDOMNode } from "../utils";

export const arrowKeyDiffs: Record<string, XYPosition> = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
};

const _NodeWrapper = ({
  id,
  xPos,
  yPos,
  selected,
  style,
  isDraggable: _isDraggable,
  isSelectable,
  isFocusable,
  resizeObserver,
  zIndex,
  visibility,
}: WrapNodeProps) => {
  const nodeRef = useRef<HTMLDivElement>(null);
  const positionAndSizeLocked = useSectionInfos(
    (x) => x.x[id].positionAndSizeLocked,
  );
  const isDraggable = _isDraggable && !positionAndSizeLocked;
  const hasPointerEvents = isSelectable || isDraggable;

  const onKeyDown = (event: KeyboardEvent) => {
    if (isInputDOMNode(event) || useFloatingBox.getState().isEnabled) {
      return;
    }

    // Early return if target element has the prevent class
    const target = event.target as HTMLElement;
    if (target.classList.contains(SETTA_PREVENT_ARROW_KEYS_MOVING_SECTION)) {
      return;
    }

    if (
      isDraggable &&
      selected &&
      Object.prototype.hasOwnProperty.call(arrowKeyDiffs, event.key)
    ) {
      updatePositions({
        x: arrowKeyDiffs[event.key].x,
        y: arrowKeyDiffs[event.key].y,
        isShiftPressed: event.shiftKey,
      });
    }
  };

  useEffect(() => {
    if (nodeRef.current) {
      const currNode = nodeRef.current;
      resizeObserver?.observe(currNode);

      return () => resizeObserver?.unobserve(currNode);
    }
  }, []);

  useDrag({
    nodeRef,
    disabled: !isDraggable,
    nodeId: id,
    isSelectable,
  });

  return (
    <div
      className={cc([
        "react-flow__node",
        {
          // this is overwritable by passing `nopan` as a class name
          [NO_PAN_CLASS_NAME]: isDraggable,
        },
        {
          selectable: isSelectable,
        },
      ])}
      ref={nodeRef}
      style={{
        transform: `translate(${xPos}px,${yPos}px)`,
        pointerEvents: hasPointerEvents ? "all" : "none",
        visibility,
        zIndex,
        ...style,
      }}
      data-id={id}
      data-testid={`rf__node-${id}`}
      onKeyDown={isFocusable ? onKeyDown : undefined}
      tabIndex={isFocusable ? 0 : undefined}
      role={isFocusable ? "button" : undefined}
    >
      <SectionContainer sectionId={id} isTopLevel={true} />
    </div>
  );
};

export const NodeWrapper = memo(_NodeWrapper);
