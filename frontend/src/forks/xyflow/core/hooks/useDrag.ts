import { drag } from "d3-drag";
import { select } from "d3-selection";
import { useReactFlow } from "forks/xyflow/core/store";
import type { MouseEvent, RefObject } from "react";
import { useEffect, useRef, useState } from "react";
import {
  raiseTempZIndex,
  updateNodePositions,
} from "state/actions/nodeInternals";
import { setZIndices } from "state/actions/sections/sectionPositions";
import {
  useActiveSection,
  useMisc,
  useNodeInternals,
  useSettings,
} from "state/definitions";
import { localStorageFns } from "state/hooks/localStorage";
import { NO_DRAG_CLASS_NAME } from "utils/constants";
import type { NodeDragItem, UseDragEvent, XYPosition } from "../types";
import { calcAutoPan, getEventPosition } from "../utils";
import useGetPointerPosition from "./useGetPointerPosition";
import { getDragItems, hasSelector } from "./utils";

export type UseDragData = { dx: number; dy: number };

type UseDragParams = {
  nodeRef: RefObject<Element>;
  disabled?: boolean;
  nodeId?: string;
  isSelectable?: boolean;
};

function useDrag({
  nodeRef,
  disabled = false,
  nodeId,
  isSelectable,
}: UseDragParams) {
  const [dragging, setDragging] = useState<boolean>(false);
  const dragItems = useRef<NodeDragItem[]>([]);
  const lastPos = useRef<{ x: number | null; y: number | null }>({
    x: null,
    y: null,
  });
  const autoPanId = useRef(0);
  const containerBounds = useRef<DOMRect | null>(null);
  const mousePosition = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragEvent = useRef<MouseEvent | null>(null);
  const autoPanStarted = useRef(false);
  const dragStarted = useRef(false);

  const getPointerPosition = useGetPointerPosition();

  useEffect(() => {
    if (nodeRef?.current) {
      const selection = select(nodeRef.current);

      const updateNodes = ({ x, y }: XYPosition, dragEnd = false) => {
        const { nodesSelectionDims, shiftNodesSelection, setNodesSelection } =
          useReactFlow.getState();

        const { snapGrid } = useSettings.getState().gui;
        const [snapToGrid] = localStorageFns.snapToGrid.state();

        const delta = { x: x - lastPos.current.x, y: y - lastPos.current.y };
        lastPos.current = { x, y };

        let hasChange = false;

        dragItems.current = dragItems.current.map((n) => {
          const nextPosition = { x: x - n.distance.x, y: y - n.distance.y };

          if (dragEnd && snapToGrid) {
            nextPosition.x =
              snapGrid[0] * Math.round(nextPosition.x / snapGrid[0]);
            nextPosition.y =
              snapGrid[1] * Math.round(nextPosition.y / snapGrid[1]);
          }

          // we want to make sure that we only fire a change event when there is a change
          hasChange =
            hasChange ||
            n.position.x !== nextPosition.x ||
            n.position.y !== nextPosition.y;

          n.position = nextPosition;

          return n;
        });

        if (!hasChange) {
          return;
        }

        updateNodePositions(dragItems.current);
        // When dragging a selection, nodeId is undefined.
        if (!nodeId && nodesSelectionDims) {
          if (dragEnd && snapToGrid) {
            setNodesSelection(dragItems.current.length);
          } else {
            shiftNodesSelection(delta);
          }
        }
        setDragging(true);
      };

      const autoPan = (): void => {
        if (!containerBounds.current) {
          return;
        }

        const [xMovement, yMovement] = calcAutoPan(
          mousePosition.current,
          containerBounds.current,
        );

        if (xMovement !== 0 || yMovement !== 0) {
          const { transform, panBy } = useReactFlow.getState();

          const newX = (lastPos.current.x ?? 0) - xMovement / transform[2];
          const newY = (lastPos.current.y ?? 0) - yMovement / transform[2];

          if (panBy({ x: xMovement, y: yMovement })) {
            updateNodes({ x: newX, y: newY } as XYPosition);
          }
        }
        autoPanId.current = requestAnimationFrame(autoPan);
      };

      const startDrag = (event: UseDragEvent) => {
        const { multiSelectionActive, nodesDraggable } =
          useReactFlow.getState();
        const nodeInternals = useNodeInternals.getState().x;
        dragStarted.current = true;

        if (
          !isSelectable &&
          !multiSelectionActive &&
          nodeId &&
          !useActiveSection.getState().ids.includes(nodeId)
        ) {
          // TODO: determine if we need to do anything here
          // It used to call unselectNodesAndEdges
        }

        const pointerPos = getPointerPosition(event);
        lastPos.current = pointerPos;
        dragItems.current = getDragItems(
          nodeInternals,
          nodesDraggable,
          pointerPos,
          nodeId,
        );

        if (dragItems.current) {
          raiseTempZIndex(dragItems.current);
          useMisc.setState({ mouseDownDraggingSection: true });
        }
      };

      if (disabled) {
        selection.on(".drag", null);
      } else {
        const dragHandler = drag()
          .on("start", (event: UseDragEvent) => {
            const { domNode, nodeDragThreshold } = useReactFlow.getState();
            if (nodeDragThreshold === 0) {
              startDrag(event);
            }

            const pointerPos = getPointerPosition(event);
            lastPos.current = pointerPos;
            containerBounds.current = domNode?.getBoundingClientRect() || null;
            mousePosition.current = getEventPosition(
              event.sourceEvent,
              containerBounds.current!,
            );
          })
          .on("drag", (event: UseDragEvent) => {
            const pointerPos = getPointerPosition(event);
            const { autoPanOnNodeDrag, nodeDragThreshold } =
              useReactFlow.getState();

            if (
              !autoPanStarted.current &&
              dragStarted.current &&
              autoPanOnNodeDrag
            ) {
              autoPanStarted.current = true;
              autoPan();
            }

            if (!dragStarted.current) {
              const x = pointerPos.xSnapped - (lastPos?.current?.x ?? 0);
              const y = pointerPos.ySnapped - (lastPos?.current?.y ?? 0);
              const distance = Math.sqrt(x * x + y * y);

              if (distance > nodeDragThreshold) {
                startDrag(event);
              }
            }

            // skip events without movement
            if (
              (lastPos.current.x !== pointerPos.xSnapped ||
                lastPos.current.y !== pointerPos.ySnapped) &&
              dragItems.current &&
              dragStarted.current
            ) {
              dragEvent.current = event.sourceEvent as MouseEvent;
              mousePosition.current = getEventPosition(
                event.sourceEvent,
                containerBounds.current!,
              );
              updateNodes(pointerPos);
            }
          })
          .on("end", (event: UseDragEvent) => {
            useMisc.setState({ mouseDownDraggingSection: false });
            if (!dragStarted.current) {
              return;
            }

            if (localStorageFns.snapToGrid.state()[0]) {
              updateNodes(lastPos.current, true);
            }

            setDragging(false);
            autoPanStarted.current = false;
            dragStarted.current = false;
            cancelAnimationFrame(autoPanId.current);

            if (dragItems.current) {
              setZIndices(
                dragItems.current.map((x) => x.id),
                true,
              );
            }
          })
          .filter((event: MouseEvent) => {
            const target = event.target as HTMLDivElement;
            const isDraggable =
              !event.button &&
              !hasSelector(target, `.${NO_DRAG_CLASS_NAME}`, nodeRef);

            return isDraggable;
          });

        selection.call(dragHandler);

        return () => {
          selection.on(".drag", null);
        };
      }
    }
  }, [nodeRef, disabled, isSelectable, nodeId, getPointerPosition]);

  return dragging;
}

export default useDrag;
