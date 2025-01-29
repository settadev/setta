import { NodesSelectionWrapper } from "forks/xyflow/core/components/NodesSelection";
import _ from "lodash";
import { memo } from "react";
import { useSettings } from "state/definitions";
import { useReactFlow } from "../store";
import Pane from "./Pane";
import ZoomPane from "./ZoomPane";

const FlowRenderer = ({ children, wrapperDimensions }) => {
  const {
    panActivationKeyPressed,
    zoomActivationKeyPressed,
    selectionKeyPressed,
  } = useReactFlow((x) => {
    return {
      panActivationKeyPressed: x.panActivationKeyPressed,
      zoomActivationKeyPressed: x.zoomActivationKeyPressed,
      selectionKeyPressed: x.selectionKeyPressed,
    };
  }, _.isEqual);

  const {
    panOnDrag,
    panOnScroll,
    panOnScrollSpeed,
    panOnScrollMode,
    zoomOnScroll,
    zoomOnPinch,
    zoomOnDoubleClick,
  } = useSettings((x) => {
    return {
      panOnDrag: x.gui.panOnDrag,
      panOnScroll: x.gui.panOnScroll,
      panOnScrollSpeed: x.gui.panOnScrollSpeed,
      panOnScrollMode: x.gui.panOnScrollMode,
      zoomOnScroll: x.gui.zoomOnScroll,
      zoomOnPinch: x.gui.zoomOnPinch,
      zoomOnDoubleClick: x.gui.zoomOnDoubleClick,
    };
  }, _.isEqual);

  return (
    <ZoomPane
      zoomOnScroll={zoomOnScroll}
      zoomOnPinch={zoomOnPinch}
      panOnScroll={panOnScroll}
      panOnScrollSpeed={panOnScrollSpeed}
      panOnScrollMode={panOnScrollMode}
      zoomOnDoubleClick={zoomOnDoubleClick}
      panOnDrag={!selectionKeyPressed && panOnDrag}
      panActivationKeyPressed={panActivationKeyPressed}
      zoomActivationKeyPressed={zoomActivationKeyPressed}
      wrapperDimensions={wrapperDimensions}
    >
      <Pane panOnDrag={panOnDrag} isSelecting={!!selectionKeyPressed}>
        {children}
        <NodesSelectionWrapper />
      </Pane>
    </ZoomPane>
  );
};

FlowRenderer.displayName = "FlowRenderer";

export default memo(FlowRenderer);
