import type { DroppableMeasuring } from "../../hooks/utilities";
import type { ClientRect } from "../../types";

export type MeasuringFunction = (node: HTMLElement) => ClientRect;

interface Measuring {
  measure: MeasuringFunction;
}

export interface DraggableMeasuring extends Measuring {}

export interface DragOverlayMeasuring extends Measuring {}

export interface MeasuringConfiguration {
  draggable?: Partial<DraggableMeasuring>;
  droppable?: Partial<DroppableMeasuring>;
  dragOverlay?: Partial<DragOverlayMeasuring>;
}
