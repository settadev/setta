import { useDndMode, useDndState } from "forks/dnd-kit/dndState";
import { useHighlightDroppable } from "forks/dnd-kit/useDndUtils";
import _ from "lodash";
import React from "react";
import { Container } from "./ContainerCore";
import { DndSlot } from "./DndSlot";

function _DndSlotAndDndWatcher({
  isGroup,
  sectionId,
  isTopLevel,
  droppableRef,
  draggableRef,
  dragListeners,
  children,
}) {
  const { style, behaviorDropType } = useHighlightDroppable({
    sectionId,
    isGroup,
  });

  return (
    <DndSlot behaviorDropType={behaviorDropType} isGroup={isGroup}>
      <DndWatcherAndContainer
        isGroup={isGroup}
        sectionId={sectionId}
        isTopLevel={isTopLevel}
        droppableRef={droppableRef}
        draggableRef={draggableRef}
        dragListeners={dragListeners}
        style={style}
      >
        {children}
      </DndWatcherAndContainer>
    </DndSlot>
  );
}

export const DndSlotAndDndWatcher = React.memo(
  _DndSlotAndDndWatcher,
  (p, n) =>
    p.isGroup === n.isGroup &&
    p.children === n.children &&
    _.isEqual(p.dragListeners, n.dragListeners),
);

function _DndWatcherAndContainer({
  isGroup,
  sectionId,
  isTopLevel,
  droppableRef,
  draggableRef,
  dragListeners,
  style,
  children,
}) {
  const activeIsSelf = useDndState((x) => x.activeId === sectionId);
  const { isSorting, isMovingFree } = useDndMode();
  const trueDragListeners =
    isMovingFree || (!isTopLevel && isSorting) ? dragListeners : {};

  // Don't want the react-flow node (which contains this child)
  // to move when sorting
  const className = isSorting || isMovingFree ? "nodrag" : "";
  const fullStyle = activeIsSelf ? { ...style, opacity: 0.5 } : style;

  return (
    <Container
      isGroup={isGroup}
      sectionId={sectionId}
      droppableRef={droppableRef}
      draggableRef={draggableRef}
      trueDragListeners={trueDragListeners}
      className={className}
      style={fullStyle}
    >
      {children}
    </Container>
  );
}

const DndWatcherAndContainer = React.memo(_DndWatcherAndContainer, _.isEqual);
