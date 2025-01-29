// Some functions borrowed from https://github.com/clauderic/dnd-kit/blob/master/packages/core/src/utilities/algorithms/closestCorners.ts

import { getSectionInfo } from "state/actions/sectionInfos";

function compareCollisions(a, b) {
  if (!a) {
    return b;
  }
  if (!b) {
    return a;
  }

  return a.data.distance < b.data.distance ? a : b;
}

function edgesOfRectangle(rect, isHorizontalOrientation) {
  if (isHorizontalOrientation) {
    return [rect.left, rect.left + rect.width];
  }
  return [rect.top, rect.top + rect.height];
}

export const customCollisionDetectionSorting = ({
  active,
  collisionRect,
  droppableRects,
  droppableContainers,
}) => {
  if (!active.data.current.sortable) {
    return [];
  }
  let bestCollision = null;
  const isHorizontalOrientation = getSectionInfo(
    active.data.current.sortable.containerId,
  ).isHorizontalOrientation;
  const corners = edgesOfRectangle(collisionRect, isHorizontalOrientation);

  for (const droppableContainer of droppableContainers) {
    const { id } = droppableContainer;
    const rect = droppableRects.get(id);

    // if droppableContainer is a sibling of active
    if (
      rect &&
      active.data.current.sortable.containerId ===
        droppableContainer.data.current.sortable?.containerId
    ) {
      const rectCorners = edgesOfRectangle(rect, isHorizontalOrientation);
      const distance =
        Math.abs(corners[0] - rectCorners[0]) +
        Math.abs(corners[1] - rectCorners[1]);
      bestCollision = compareCollisions(bestCollision, {
        id,
        data: {
          droppableContainer,
          distance,
        },
      });
    }
  }

  return bestCollision ? [bestCollision] : [];
};
