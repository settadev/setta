import type { Transform } from "@dnd-kit/utilities";
import type { ClientRect } from "forks/dnd-kit/CustomCore";

export type SortingStrategy = (args: {
  activeNodeRect: ClientRect | null;
  activeIndex: number;
  index: number;
  rects: ClientRect[];
  overIndex: number;
}) => Transform | null;
