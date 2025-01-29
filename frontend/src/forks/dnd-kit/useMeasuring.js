import { MeasuringFrequency } from "forks/dnd-kit/CustomCore";
import { useDndState } from "./dndState";

export function useMeasuring() {
  const isDraggingFreely = useDndState((x) => x.isMovingFree && !!x.activeId);
  const frequency = isDraggingFreely ? 200 : MeasuringFrequency.Optimized;
  return {
    droppable: { frequency },
  };
}
