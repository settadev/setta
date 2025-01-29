import {
  horizontalListSortingStrategy,
  SortableContext,
  verticalListSortingStrategy,
} from "forks/dnd-kit/CustomSortable";
import { useDisableSortable } from "forks/dnd-kit/useDndUtils";
import { getSectionInfo } from "state/actions/sectionInfos";
import { useDndState } from "./dndState";
import { getDndParentId } from "./useDropType";

export function DNDSortable({ sectionId, items, children }) {
  const disabled = useDisableSortable(sectionId);
  const idForDeterminingStrategy = useDndState((x) =>
    x.isSorting ? x.activeId : x.overId,
  );

  return (
    <SortableContext
      id={sectionId}
      items={items}
      strategy={getSortingStrategy(disabled, idForDeterminingStrategy)}
      disabled={disabled}
    >
      {children}
    </SortableContext>
  );
}

function DisabledSortingStrategy() {
  return [{ x: 0, y: 0, scaleX: 1, scaleY: 1 }, -1];
}

function getSortingStrategy(disabled, idForDeterminingStrategy) {
  if (disabled.draggable || disabled.droppable) {
    return DisabledSortingStrategy;
  }

  if (idForDeterminingStrategy) {
    const parentId = getDndParentId(idForDeterminingStrategy);
    if (parentId) {
      return getSectionInfo(parentId).isHorizontalOrientation
        ? horizontalListSortingStrategy
        : verticalListSortingStrategy;
    }
  }
  return DisabledSortingStrategy;
}
