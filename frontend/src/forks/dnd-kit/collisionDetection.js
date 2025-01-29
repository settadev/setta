// Some functions borrowed from https://github.com/clauderic/dnd-kit/blob/master/packages/core/src/utilities/algorithms

import { useReactFlow } from "forks/xyflow/core/store";
import { getSectionInfo } from "state/actions/sectionInfos";

function compareCollisions(a, b) {
  if (!a) {
    return b;
  }
  if (!b) {
    return a;
  }

  // When comparing two nested sections, first check if they are left-aligned.
  // If they are not left-aligned, then prioritize the section that has the smallest left distance.
  // If they are left-aligned, then prioritize the section with most intersection.
  const cidA = a.data.droppableContainer.data.current.sortable?.containerId;
  const cidB = b.data.droppableContainer.data.current.sortable?.containerId;
  // sortable A prioritized before non-sortable B
  if (cidA && !cidB) {
    return a;
  }
  // sortable B prioritized before non-sortable A
  if (!cidA && cidB) {
    return b;
  }

  const ra = a.data.intersectionRatio;
  const rb = b.data.intersectionRatio;

  if (cidA && cidB) {
    const la = a.data.absTriggerDist;
    const lb = b.data.absTriggerDist;
    const rawLa = a.data.triggerDist;
    const rawLb = b.data.triggerDist;
    // if left-aligned, return rect with larger intersection
    if (la - lb === 0) {
      return rb - ra > 0 ? b : a;
    }
    // if the active rect is to the right of both rects, then return the one that has the closest left edge
    if (rawLa > 0 && rawLb > 0) {
      return la - lb > 0 ? b : a;
    }
    // if b's left edge is closer than a's left edge
    // and the active rect is to the left of b, then return b
    if (la - lb > 0) {
      return rawLb < 0 ? b : a;
    }
    // if a's left edge is closer than b's left edge
    // and the active rect is to the left of a, then return a
    if (lb - la > 0) {
      return rawLa < 0 ? a : b;
    }
  }
  // for two non-sortables, use intersection area
  return rb - ra > 0 ? b : a;
}

function getIntersectionRatio(entry, target) {
  const top = Math.max(target.top, entry.top);
  const left = Math.max(target.left, entry.left);
  const right = Math.min(target.left + target.width, entry.left + entry.width);
  const bottom = Math.min(target.top + target.height, entry.top + entry.height);
  const width = right - left;
  const height = bottom - top;

  if (left < right && top < bottom) {
    // const targetArea = target.width * target.height;
    // const entryArea = entry.width * entry.height;
    const intersectionArea = width * height;
    // const intersectionRatio =
    // intersectionArea / (targetArea + entryArea - intersectionArea);

    return Number(intersectionArea.toFixed(4));
  }

  // Rectangles do not overlap, or overlap has an area of zero (edge/corner overlap)
  return 0;
}

function getTriggerDistCondition(activeId, collision, containerIsHorizontal) {
  // true if section is not top level and doesn't have children
  // and active section is to the right of this section by at least 100 pixels (adjusted by zoom)
  return (
    !collision?.data.droppableContainer.data.current.isTopLevel &&
    (!collision?.data.droppableContainer.data.current.hasNested ||
      collision?.data.droppableContainer.data.current.onlyChildId ===
        activeId) &&
    collision?.data.triggerDist >
      (!containerIsHorizontal ? 100 : 20) * useReactFlow.getState().transform[2]
  );
}

let prevCollisionId = null;
let prevPastHalfway = null;

export function customCollisionDetection({
  active,
  collisionRect,
  droppableRects,
  droppableContainers,
}) {
  let bestCollision = null;
  const { left, top } = collisionRect;
  let ratio, rect, id, triggerDist, containerIsHorizontal;

  for (const droppableContainer of droppableContainers) {
    id = droppableContainer.id;
    rect = droppableRects.get(id);

    // rect must exist.
    if (rect && active.id !== id) {
      ratio = getIntersectionRatio(rect, collisionRect);
      if (ratio) {
        if (prevCollisionId === id) {
          ratio *= 1.1;
        }
        containerIsHorizontal = getSectionInfo(
          droppableContainer.data.current.sortable?.containerId,
        )?.isHorizontalOrientation;
        triggerDist = !containerIsHorizontal
          ? left - rect.left
          : top - rect.top;
        bestCollision = compareCollisions(bestCollision, {
          id,
          data: {
            droppableContainer,
            absTriggerDist: Math.abs(triggerDist),
            triggerDist,
            intersectionRatio: ratio,
          },
        });
      }
    }
  }

  if (bestCollision) {
    let buffer = 0;
    if (prevCollisionId === bestCollision.id) {
      if (prevPastHalfway === true) {
        buffer = 10;
      } else if (prevPastHalfway === false) {
        buffer = -10;
      }
    }

    const containerIsHorizontal = getSectionInfo(
      bestCollision.data.droppableContainer.data.current.sortable?.containerId,
    )?.isHorizontalOrientation;

    if (!containerIsHorizontal) {
      bestCollision.pastHalfway =
        (collisionRect.top + collisionRect.bottom) / 2 + buffer >
        (droppableRects.get(bestCollision.id).top +
          droppableRects.get(bestCollision.id).bottom) /
          2;
    } else {
      bestCollision.pastHalfway =
        (collisionRect.left + collisionRect.right) / 2 + buffer >
        (droppableRects.get(bestCollision.id).left +
          droppableRects.get(bestCollision.id).right) /
          2;
    }

    bestCollision.triggerDistCondition = getTriggerDistCondition(
      active.id,
      bestCollision,
      containerIsHorizontal,
    );

    prevCollisionId = bestCollision.id;
    prevPastHalfway = bestCollision.pastHalfway;
    return [bestCollision];
  }

  prevCollisionId = null;
  return [];
}
