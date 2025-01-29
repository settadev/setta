import { DndContext } from "forks/dnd-kit/CustomCore";
import { DummyDragOverlay } from "./DummySection";
import { useDNDSensors } from "./useDNDSensors";
import { onDragStart, useOnDragMove, useOnDragOver } from "./useDropType";
import { useMeasuring } from "./useMeasuring";
import { useModifiers } from "./useModifiers";
import { useOnDragEnd as useOnDragEndMoveSection } from "./useMoveSection";

export function GlobalDndContext({ children }) {
  const { dummyRef, onDragEnd } = useOnDragEndMoveSection();
  const onDragMove = useOnDragMove();
  const onDragOver = useOnDragOver();
  const { modifiers, collisionDetection } = useModifiers();
  const sensors = useDNDSensors();
  const measuring = useMeasuring();

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={onDragStart}
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      modifiers={modifiers}
      measuring={measuring}
      autoScroll={false}
    >
      {children}
      <DummyDragOverlay ref={dummyRef} />
    </DndContext>
  );
}
