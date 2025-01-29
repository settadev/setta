import type { UniqueIdentifier } from "forks/dnd-kit/CustomCore";

export type SortableData = {
  sortable: {
    containerId: UniqueIdentifier;
    items: UniqueIdentifier[];
    index: number;
  };
};
