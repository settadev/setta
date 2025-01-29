import { useIsomorphicLayoutEffect, useUniqueId } from "@dnd-kit/utilities";
import {
  ClientRect,
  UniqueIdentifier,
  useDndContext,
} from "forks/dnd-kit/CustomCore";
import React, { useEffect, useMemo, useRef } from "react";

import { getDndSectionId } from "forks/dnd-kit/dndState";
import { rectSortingStrategy } from "../strategies";
import type { Disabled, SortingStrategy } from "../types";
import { getSortedRects, itemsEqual, normalizeDisabled } from "../utilities";

export interface Props {
  children: React.ReactNode;
  items: (UniqueIdentifier | { id: UniqueIdentifier })[];
  strategy?: SortingStrategy;
  id?: string;
  disabled?: boolean | Disabled;
}

const ID_PREFIX = "Sortable";

interface ContextDescriptor {
  activeIndex: number;
  containerId: string;
  disabled: Disabled;
  disableTransforms: boolean;
  items: UniqueIdentifier[];
  overIndex: number;
  useDragOverlay: boolean;
  sortedRects: ClientRect[];
  strategy: SortingStrategy;
}

export const Context = React.createContext<ContextDescriptor>({
  activeIndex: -1,
  containerId: ID_PREFIX,
  disableTransforms: false,
  items: [],
  overIndex: -1,
  useDragOverlay: false,
  sortedRects: [],
  strategy: rectSortingStrategy,
  disabled: {
    draggable: false,
    droppable: false,
  },
});

export function SortableContext({
  children,
  id,
  items: userDefinedItems,
  strategy = rectSortingStrategy,
  disabled: disabledProp = false,
}: Props) {
  const {
    active,
    dragOverlay,
    droppableRects,
    overId,
    measureDroppableContainers,
  } = useDndContext();
  const containerId = useUniqueId(ID_PREFIX, id);
  const useDragOverlay = Boolean(dragOverlay.rect !== null);
  const items = useMemo<UniqueIdentifier[]>(
    () =>
      userDefinedItems.map((item) =>
        typeof item === "object" && "id" in item ? item.id : item,
      ),
    [userDefinedItems],
  );
  const isDragging = active != null;
  // SETTA FORK CHANGE
  const activeIndex = getActiveIndex(active, items);
  // END OF SETTA FORK CHANGE
  const overIndex = overId ? items.indexOf(overId) : -1;
  const previousItemsRef = useRef(items);
  const itemsHaveChanged = !itemsEqual(items, previousItemsRef.current);
  const disableTransforms =
    (overIndex !== -1 && activeIndex === -1) || itemsHaveChanged;
  const disabled = normalizeDisabled(disabledProp);

  useIsomorphicLayoutEffect(() => {
    if (itemsHaveChanged && isDragging) {
      measureDroppableContainers(items);
    }
  }, [itemsHaveChanged, items, isDragging, measureDroppableContainers]);

  useEffect(() => {
    previousItemsRef.current = items;
  }, [items]);

  const contextValue = useMemo(
    (): ContextDescriptor => ({
      activeIndex,
      containerId,
      disabled,
      disableTransforms,
      items,
      overIndex,
      useDragOverlay,
      sortedRects: getSortedRects(items, droppableRects),
      strategy,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      activeIndex,
      containerId,
      disabled.draggable,
      disabled.droppable,
      disableTransforms,
      items,
      overIndex,
      droppableRects,
      useDragOverlay,
      strategy,
    ],
  );

  return <Context.Provider value={contextValue}>{children}</Context.Provider>;
}

// SETTA FORK CHANGE
function getActiveIndex(active, items) {
  if (!active) {
    return -1;
  }
  const tempIndex = items.indexOf(getDndSectionId(active.id));
  return tempIndex >= 0 ? tempIndex : items.indexOf(active.id);
}
// END OF SETTA FORK CHANGE
