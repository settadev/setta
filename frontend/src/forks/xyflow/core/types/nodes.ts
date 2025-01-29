/* eslint-disable @typescript-eslint/no-explicit-any */
import type { CSSProperties, MouseEvent as ReactMouseEvent } from "react";

import type { XYPosition } from ".";

// interface for the user node items
export type Node<U extends string | undefined = string | undefined> = {
  id: string;
  position: XYPosition;
  style?: CSSProperties;
  dragging?: boolean;
  draggable?: boolean;
  selectable?: boolean;
  width?: number | null;
  height?: number | null;
  zIndex: number;
  tempZIndex: number;
  focusable?: boolean;
};

export type NodeMouseHandler = (event: ReactMouseEvent, node: Node) => void;
export type NodeDragHandler = (
  event: ReactMouseEvent,
  node: Node,
  nodes: Node[],
) => void;
export type SelectionDragHandler = (
  event: ReactMouseEvent,
  nodes: Node[],
) => void;

export type WrapNodeProps<T = any> = Pick<Node<T>, "id" | "style"> & {
  xPos: number;
  yPos: number;
  isSelectable: boolean;
  isDraggable: boolean;
  isFocusable: boolean;
  resizeObserver: ResizeObserver | null;
  zIndex: number;
};

// props that get passed to a custom node
export type NodeProps<T = any> = Pick<
  WrapNodeProps<T>,
  "id" | "xPos" | "yPos"
> & {
  dragging: boolean;
};

export type NodeDimensionUpdate = {
  id: string;
  nodeElement: HTMLDivElement;
  forceUpdate?: boolean;
};

export type NodeInternals = Map<string, Node>;

export type NodeBounds = XYPosition & {
  width: number | null;
  height: number | null;
};

export type NodeDragItem = {
  id: string;
  position: XYPosition;
  // distance from the mouse cursor to the node when start dragging
  distance: XYPosition;
  width?: number | null;
  height?: number | null;
  dragging?: boolean;
};
