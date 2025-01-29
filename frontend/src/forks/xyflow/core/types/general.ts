/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  D3DragEvent,
  Selection as D3Selection,
  SubjectPosition,
  ZoomBehavior,
} from "d3";

import type { Node } from "./nodes";
import type { CoordinateExtent, Rect, Transform, XYPosition } from "./utils";

export type FitView = (fitViewOptions?: FitViewOptions) => boolean;

export type Project = (position: XYPosition) => XYPosition;

export type OnNodesDelete = (nodes: Node[]) => void;

export type OnMove = (
  event: MouseEvent | TouchEvent,
  viewport: Viewport,
) => void;
export type OnMoveStart = OnMove;
export type OnMoveEnd = OnMove;

export type ZoomInOut = (options?: ViewportHelperFunctionOptions) => void;
export type ZoomTo = (
  zoomLevel: number,
  options?: ViewportHelperFunctionOptions,
) => void;
export type GetZoom = () => number;
export type GetViewport = () => Viewport;
export type SetViewport = (
  viewport: Viewport,
  options?: ViewportHelperFunctionOptions,
) => void;
export type SetCenter = (
  x: number,
  y: number,
  options?: SetCenterOptions,
) => void;
export type FitBounds = (bounds: Rect, options?: FitBoundsOptions) => void;

export type FitViewOptions = {
  padding?: number;
  minZoom?: number;
  maxZoom?: number;
  duration?: number;
  nodes?: (Partial<Node> & { id: Node["id"] })[];
};

export type Viewport = {
  x: number;
  y: number;
  zoom: number;
};

export type SnapGrid = [number, number];

export enum PanOnScrollMode {
  Free = "free",
  Vertical = "vertical",
  Horizontal = "horizontal",
}

export type ViewportHelperFunctionOptions = {
  duration?: number;
};

export type SetCenterOptions = ViewportHelperFunctionOptions & {
  zoom?: number;
};

export type FitBoundsOptions = ViewportHelperFunctionOptions & {
  padding?: number;
};

export type UnselectNodesAndEdgesParams = {
  nodes?: Node[];
};

export type OnViewportChange = (viewport: Viewport) => void;

export type ReactFlowStore = {
  width: number;
  height: number;
  transform: Transform;
  domNode: HTMLDivElement | null;
  paneDragging: boolean;

  d3Zoom: ZoomBehavior<Element, unknown> | null;
  d3Selection: D3Selection<Element, unknown, null, undefined> | null;
  d3ZoomHandler: ((this: Element, event: any, d: unknown) => void) | undefined;
  translateExtent: CoordinateExtent;
  nodeDragThreshold: number;

  nodesSelectionDims: {
    width: number;
    height: number;
    x: number;
    y: number;
  } | null;
  userSelectionActive: boolean;
  userSelectionRect: SelectionRect | null;

  nodesDraggable: boolean;
  nodesFocusable: boolean;
  elementsSelectable: boolean;

  multiSelectionActive: boolean;

  fitViewOnInit: boolean;
  fitViewOnInitDone: boolean;
  fitViewOnInitOptions: FitViewOptions | undefined;

  autoPanOnNodeDrag: boolean;
};

export type ReactFlowActions = {
  setMinZoom: (minZoom: number) => void;
  setMaxZoom: (maxZoom: number) => void;
  setTranslateExtent: (translateExtent: CoordinateExtent) => void;
  reset: () => void;
  panBy: (delta: XYPosition) => boolean;
};

export type ReactFlowState = ReactFlowStore & ReactFlowActions;

export type UpdateNodeInternals = (nodeId: string | string[]) => void;

export type OnSelectionChangeParams = {
  nodes: Node[];
};

export type OnSelectionChangeFunc = (params: OnSelectionChangeParams) => void;

export type PanelPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export type UseDragEvent = D3DragEvent<HTMLDivElement, null, SubjectPosition>;

export enum SelectionMode {
  Partial = "partial",
  Full = "full",
}

export type SelectionRect = Rect & {
  startX: number;
  startY: number;
};

export type OnError = (id: string, message: string) => void;
