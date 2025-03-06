import { useDndState } from "forks/dnd-kit/dndState";
import { useReactFlow } from "forks/xyflow/core/store";

export function useShouldDisablePointerEvents() {
  const isSortingOrMovingFree = useDndState(
    (x) => x.isSorting || x.isMovingFree,
  );
  const otherSpecialKeysPressed = useReactFlow(
    (x) =>
      x.moveSectionActivationKeyPressed ||
      (x.selectionKeyPressed && Boolean(x.userSelectionRect)) ||
      x.multiSelectionActive ||
      x.zoomActivationKeyPressed,
  );
  return isSortingOrMovingFree || otherSpecialKeysPressed;
}
