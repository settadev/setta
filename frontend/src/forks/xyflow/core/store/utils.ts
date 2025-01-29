import { zoomIdentity } from "d3-zoom";

import { getNodes } from "state/actions/nodeInternals";
import { useSettings } from "state/definitions";
import { useReactFlow } from ".";
import type { FitViewOptions } from "../types";
import {
  getD3Transition,
  getNodesBounds,
  getViewportForBounds,
} from "../utils/graph";

type InternalFitViewOptions = {
  initial?: boolean;
} & FitViewOptions;

export function fitView(options: InternalFitViewOptions = {}) {
  const {
    width,
    height,
    d3Zoom,
    d3Selection,
    fitViewOnInitDone,
    fitViewOnInit,
  } = useReactFlow.getState();

  const { minZoom, maxZoom } = useSettings.getState().gui;

  const isInitialFitView =
    options.initial && !fitViewOnInitDone && fitViewOnInit;
  const d3initialized = d3Zoom && d3Selection;

  if (d3initialized && (isInitialFitView || !options.initial)) {
    const nodes = getNodes().filter((n) => {
      if (options.nodes?.length) {
        return options.nodes.some((optionNode) => optionNode.id === n.id);
      }

      return true;
    });

    const nodesInitialized = nodes.every((n) => n.width && n.height);

    if (nodes.length > 0 && nodesInitialized) {
      const bounds = getNodesBounds(nodes);

      const { x, y, zoom } = getViewportForBounds(
        bounds,
        width,
        height,
        options.minZoom ?? minZoom,
        options.maxZoom ?? maxZoom,
        options.padding ?? 0.1,
      );

      const nextTransform = zoomIdentity.translate(x, y).scale(zoom);

      if (typeof options.duration === "number" && options.duration > 0) {
        d3Zoom.transform(
          getD3Transition(d3Selection, options.duration),
          nextTransform,
        );
      } else {
        d3Zoom.transform(d3Selection, nextTransform);
      }

      return true;
    }
  }

  return false;
}

export function onFitViewHandler() {
  if (useReactFlow.getState().fitViewOnInit) {
    return;
  }
  const duration = useSettings.getState().gui.transitionDuration;
  fitView({ duration });
  // Hack to set fitViewOnInit after transform is done.
  // If it gets set before the transform is done, then the
  // reactFitViewOnInitSubscriptionFn subscription will get
  // triggered and it will reset to fitViewOnInit
  setTimeout(
    () => useReactFlow.setState({ fitViewOnInit: true }),
    duration + 10,
  );
}

export function computeReadyToBeVisible(reactFlowState) {
  return !reactFlowState.fitViewOnInit || reactFlowState.fitViewOnInitDone;
}
