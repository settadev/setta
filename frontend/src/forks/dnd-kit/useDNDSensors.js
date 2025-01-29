import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "forks/dnd-kit/CustomCore";
import { sortableKeyboardCoordinates } from "forks/dnd-kit/CustomSortable";

export function useDNDSensors() {
  return useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
}
