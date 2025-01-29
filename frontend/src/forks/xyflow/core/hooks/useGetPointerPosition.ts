import { useCallback } from "react";
import { useReactFlow } from "../store";
import type { UseDragEvent } from "../types";

function useGetPointerPosition() {
  // returns the pointer position projected to the RF coordinate system
  const getPointerPosition = useCallback(({ sourceEvent }: UseDragEvent) => {
    const { transform } = useReactFlow.getState();
    const x = sourceEvent.touches
      ? sourceEvent.touches[0].clientX
      : sourceEvent.clientX;
    const y = sourceEvent.touches
      ? sourceEvent.touches[0].clientY
      : sourceEvent.clientY;

    const pointerPos = {
      x: (x - transform[0]) / transform[2],
      y: (y - transform[1]) / transform[2],
    };

    return {
      xSnapped: pointerPos.x,
      ySnapped: pointerPos.y,
      ...pointerPos,
    };
  }, []);

  return getPointerPosition;
}

export default useGetPointerPosition;

// return {
//   xSnapped: snapToGrid
//     ? snapGrid[0] * Math.round(pointerPos.x / snapGrid[0])
//     : pointerPos.x,
//   ySnapped: snapToGrid
//     ? snapGrid[1] * Math.round(pointerPos.y / snapGrid[1])
//     : pointerPos.y,
//   ...pointerPos,
// };
