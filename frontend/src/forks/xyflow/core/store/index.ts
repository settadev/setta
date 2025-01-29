import { zoomIdentity } from "d3-zoom";
import { create } from "state/utils";
import { subscribeWithSelector } from "zustand/middleware";
import type { CoordinateExtent, ReactFlowState, XYPosition } from "../types";
import { getActiveSectionsBounds } from "../utils/graph";
import initialState from "./initialState";

export const useReactFlow = create<ReactFlowState>(
  subscribeWithSelector((set, get) => ({
    ...initialState,
    setNodesSelection: (selectedNodesCount, ignoreGrid = false) => {
      if (selectedNodesCount > 0) {
        set({ nodesSelectionDims: getActiveSectionsBounds(ignoreGrid) });
      }
    },
    shiftNodesSelection: (delta) => {
      set((state) => ({
        nodesSelectionDims: {
          ...state.nodesSelectionDims,
          x: state.nodesSelectionDims.x + delta.x,
          y: state.nodesSelectionDims.y + delta.y,
        },
      }));
    },
    setTranslateExtent: (translateExtent: CoordinateExtent) => {
      get().d3Zoom?.translateExtent(translateExtent);

      set({ translateExtent });
    },
    panBy: (delta: XYPosition): boolean => {
      const { transform, width, height, d3Zoom, d3Selection, translateExtent } =
        get();

      if (!d3Zoom || !d3Selection || (!delta.x && !delta.y)) {
        return false;
      }

      const nextTransform = zoomIdentity
        .translate(transform[0] + delta.x, transform[1] + delta.y)
        .scale(transform[2]);

      const extent: CoordinateExtent = [
        [0, 0],
        [width, height],
      ];

      const constrainedTransform = d3Zoom?.constrain()(
        nextTransform,
        extent,
        translateExtent,
      );
      d3Zoom.transform(d3Selection, constrainedTransform);

      const transformChanged =
        transform[0] !== constrainedTransform.x ||
        transform[1] !== constrainedTransform.y ||
        transform[2] !== constrainedTransform.k;

      return transformChanged;
    },
  })),
);
