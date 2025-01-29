import type { ClientRect } from "forks/dnd-kit/CustomCore";
import type { SortingStrategy } from "../types";
import { computeNewIndex } from "./computeNewIndex";

// To-do: We should be calculating scale transformation
const defaultScale = {
  scaleX: 1,
  scaleY: 1,
};

export const horizontalListSortingStrategy: SortingStrategy = ({
  rects,
  activeNodeRect: fallbackActiveRect,
  activeIndex,
  overIndex,
  index,
  pastHalfway,
}) => {
  const activeNodeRect = rects[activeIndex] ?? fallbackActiveRect;
  const effectiveOverIndex =
    pastHalfway !== undefined
      ? computeNewIndex(activeIndex, overIndex, pastHalfway, rects.length)
      : overIndex;

  if (!activeNodeRect) {
    return [null, effectiveOverIndex];
  }

  if (index === activeIndex) {
    const newIndexRect = rects[effectiveOverIndex];

    if (!newIndexRect) {
      return [null, effectiveOverIndex];
    }

    return [
      {
        x:
          activeIndex < effectiveOverIndex
            ? newIndexRect.left +
              newIndexRect.width -
              (activeNodeRect.left + activeNodeRect.width)
            : newIndexRect.left - activeNodeRect.left,
        y: 0,
        ...defaultScale,
      },
      effectiveOverIndex,
    ];
  }

  const itemGap = getItemGap(rects, index, activeIndex);

  if (index > activeIndex && index <= effectiveOverIndex) {
    return [
      {
        x: -activeNodeRect.width - itemGap,
        y: 0,
        ...defaultScale,
      },
      effectiveOverIndex,
    ];
  }

  if (index < activeIndex && index >= effectiveOverIndex) {
    return [
      {
        x: activeNodeRect.width + itemGap,
        y: 0,
        ...defaultScale,
      },
      effectiveOverIndex,
    ];
  }

  return [
    {
      x: 0,
      y: 0,
      ...defaultScale,
    },
    effectiveOverIndex,
  ];
};

function getItemGap(rects: ClientRect[], index: number, activeIndex: number) {
  const currentRect: ClientRect | undefined = rects[index];
  const previousRect: ClientRect | undefined = rects[index - 1];
  const nextRect: ClientRect | undefined = rects[index + 1];

  if (!currentRect || (!previousRect && !nextRect)) {
    return 0;
  }

  if (activeIndex < index) {
    return previousRect
      ? currentRect.left - (previousRect.left + previousRect.width)
      : nextRect.left - (currentRect.left + currentRect.width);
  }

  return nextRect
    ? nextRect.left - (currentRect.left + currentRect.width)
    : currentRect.left - (previousRect.left + previousRect.width);
}
