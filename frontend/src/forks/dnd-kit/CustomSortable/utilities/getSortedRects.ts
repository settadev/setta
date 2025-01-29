import type {
  ClientRect,
  UniqueIdentifier,
  UseDndContextReturnValue,
} from "forks/dnd-kit/CustomCore";

export function getSortedRects(
  items: UniqueIdentifier[],
  rects: UseDndContextReturnValue["droppableRects"],
) {
  return items.reduce<ClientRect[]>((accumulator, id, index) => {
    const rect = rects.get(id);

    if (rect) {
      accumulator[index] = rect;
    }

    return accumulator;
  }, Array(items.length));
}
