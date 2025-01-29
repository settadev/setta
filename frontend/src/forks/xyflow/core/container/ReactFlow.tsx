import Background from "forks/xyflow/background/Background";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useSettings } from "state/definitions";
import { localStorageFns } from "state/hooks/localStorage";
import { useReactFlow } from "../store";
import FlowRenderer from "./FlowRenderer";
import NodeRenderer from "./NodeRenderer";
import ViewportWrapper from "./Viewport";

const wrapperStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  overflow: "hidden",
  position: "relative",
  userSelect: "none", //to prevent text from being selected when shift clicking or right-clicking pane
};

const SCROLL_INIT = 5000;

const ReactFlow = () => {
  const [snapToGrid] = localStorageFns.snapToGrid.hook();
  const showGridLines = useSettings((x) => !!x.gui.showGridLines);
  const ref = useRef();
  const [initialized, setInitialized] = useState(false);
  const wrapperDimensions = useWrapperDivDimensions(ref);

  useEffect(() => {
    ref.current.scrollTop = SCROLL_INIT;
    ref.current.scrollLeft = SCROLL_INIT;
    setInitialized(true);
  }, []);

  const readyToRender =
    wrapperDimensions.height > 0 && wrapperDimensions.width > 0;

  return (
    <div
      style={wrapperStyle}
      className="react-flow setta-light dark:setta-dark"
      data-testid="rf__wrapper"
      ref={ref}
      onScroll={(e) => cancelOutScrolling(e, initialized)}
    >
      {/* The purpose of this div is to allow us to set scrollTop and scrollLeft to a large initial value*/}
      {/* so that onScroll can be triggered in any direction. */}
      {/* That way, we can leverage the browser's scroll behavior in any direction, if we want to. */}
      <div
        style={{
          position: "relative",
          height: `${SCROLL_INIT}px`,
          width: `${SCROLL_INIT}px`,
          top: `${SCROLL_INIT}px`,
          left: `${SCROLL_INIT}px`,
        }}
      >
        <FlowRenderer wrapperDimensions={wrapperDimensions}>
          <ViewportWrapper>{readyToRender && <NodeRenderer />}</ViewportWrapper>
        </FlowRenderer>
        {snapToGrid && showGridLines && <Background />}
      </div>
    </div>
  );
};

function cancelOutScrolling(e, initialized) {
  if (!initialized) {
    return;
  }
  const { d3Zoom, d3Selection, transform } = useReactFlow.getState();
  d3Zoom.translateBy(
    d3Selection,
    -(e.target.scrollLeft - SCROLL_INIT) / transform[2],
    -(e.target.scrollTop - SCROLL_INIT) / transform[2],
  );
  e.target.scrollTop = SCROLL_INIT;
  e.target.scrollLeft = SCROLL_INIT;
}

function useWrapperDivDimensions(ref) {
  const [overviewWidth] = localStorageFns.overviewTrueWidth.hook();
  const [uiEditorWidth] = localStorageFns.uiEditorTrueWidth.hook();

  const [wrapperDimensions, setWrapperDimensions] = useState({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    let resizeObserver;

    if (ref.current) {
      resizeObserver = new ResizeObserver((entries) => {
        const { width, height } = entries[0].contentRect;

        // Set wrapper dimensions
        setWrapperDimensions({ width, height });

        // Set React Flow state
        useReactFlow.setState({
          width: width - overviewWidth - uiEditorWidth || 500,
          height: height || 500,
        });
      });

      resizeObserver.observe(ref.current);
    }

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [overviewWidth, uiEditorWidth]);

  return wrapperDimensions;
}

ReactFlow.displayName = "ReactFlow";

export default ReactFlow;
