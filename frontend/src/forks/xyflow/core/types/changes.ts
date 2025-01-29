/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Node } from "./nodes";
import type { Dimensions, XYPosition } from "./utils";

export type NodeDimensionChange = {
  id: string;
  type: "dimensions";
  dimensions?: Dimensions;
  updateStyle?: boolean;
};

export type NodePositionChange = {
  id: string;
  type: "position";
  position?: XYPosition;
  dragging?: boolean;
};

export type NodeRemoveChange = {
  id: string;
  type: "remove";
};

export type NodeAddChange<NodeData = any> = {
  item: Node<NodeData>;
  type: "add";
};

export type NodeResetChange<NodeData = any> = {
  item: Node<NodeData>;
  type: "reset";
};

export type NodeChange =
  | NodeDimensionChange
  | NodePositionChange
  | NodeRemoveChange
  | NodeAddChange
  | NodeResetChange;
