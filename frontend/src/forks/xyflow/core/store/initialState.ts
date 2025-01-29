import type { CoordinateExtent, ReactFlowStore } from "../types";

export const infiniteExtent: CoordinateExtent = [
  [Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY],
  [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY],
];

const initialState: ReactFlowStore = {
  width: 0,
  height: 0,
  transform: [0, 0, 1],
  d3Zoom: null,
  d3Selection: null,
  d3ZoomHandler: undefined,
  translateExtent: infiniteExtent,
  nodesSelectionDims: null,
  userSelectionActive: false,
  userSelectionRect: null,
  domNode: null,
  paneDragging: false,
  nodeDragThreshold: 1,
  nodesDraggable: true,
  nodesFocusable: true,
  elementsSelectable: true,
  fitViewOnInit: false,
  fitViewOnInitDone: false,
  fitViewOnInitOptions: undefined,
  multiSelectionActive: false,
  autoPanOnNodeDrag: true,
  selectionKeyPressed: false,
};

export default initialState;
