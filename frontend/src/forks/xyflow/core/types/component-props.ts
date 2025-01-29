import type { CoordinateExtent, PanOnScrollMode } from ".";

export type ReactFlowProps = {
  nodesDraggable?: boolean;
  nodesFocusable?: boolean;
  elementsSelectable?: boolean;
  panOnDrag?: boolean | number[];
  translateExtent?: CoordinateExtent;
  preventScrolling?: boolean;
  zoomOnScroll?: boolean;
  zoomOnPinch?: boolean;
  panOnScroll?: boolean;
  panOnScrollSpeed?: number;
  panOnScrollMode?: PanOnScrollMode;
  zoomOnDoubleClick?: boolean;
  autoPanOnNodeDrag?: boolean;
};

export type ReactFlowRefType = HTMLDivElement;
