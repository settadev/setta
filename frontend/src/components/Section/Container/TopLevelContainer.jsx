import { useDraggable, useDroppable } from "forks/dnd-kit/CustomCore";
import { useDndState } from "forks/dnd-kit/dndState";
import { useDndProps } from "forks/dnd-kit/useDndUtils";
import { DndSlotAndDndWatcher } from "./ContainerWrappers";

export function TopLevelContainer({
  isGroup,
  sectionId,
  visibility,
  viewingEditingMode,
  children,
}) {
  const activeIsSelf = useDndState((x) => x.activeId === sectionId);
  const dndProps = useDndProps({ sectionId, isTopLevel: true });
  const { setNodeRef: droppableRef } = useDroppable({
    ...dndProps,
    disabled: activeIsSelf,
  });
  const { listeners: dragListeners, setNodeRef: draggableRef } =
    useDraggable(dndProps);

  return (
    <DndSlotAndDndWatcher
      isGroup={isGroup}
      sectionId={sectionId}
      isTopLevel={true}
      droppableRef={droppableRef}
      draggableRef={draggableRef}
      dragListeners={dragListeners}
      visibility={visibility}
      viewingEditingMode={viewingEditingMode}
    >
      {children}
    </DndSlotAndDndWatcher>
  );
}
