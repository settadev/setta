/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import cc from "classcat";
import { pointer, select } from "d3-selection";
import type { D3ZoomEvent } from "d3-zoom";
import { zoom, zoomIdentity } from "d3-zoom";
import { useReactFlow } from "forks/xyflow/core/store";
import type { MouseEvent } from "react";
import { memo, useEffect, useRef } from "react";
import { getNodes } from "state/actions/nodeInternals";
import { useNodeInternals } from "state/definitions";
import { localStorageFns } from "state/hooks/localStorage";
import { shallow } from "zustand/shallow";
import Panel from "../core/components/Panel";
import { CoordinateExtent, Rect } from "../core/types";
import { getBoundsOfRects } from "../core/utils";
import { getNodesBounds, getPaneRect } from "../core/utils/graph";
import { MiniMapNodes, MiniMapNodesReactive } from "./MiniMapNodes";
import type { MiniMapProps } from "./types";

const defaultWidth = 200;
const defaultHeight = 150;

function getSelector(nodes, overviewWidth) {
  return (s) => {
    const viewBB: Rect = getPaneRect(s, overviewWidth);

    return {
      viewBB,
      boundingRect:
        nodes.length > 0
          ? getBoundsOfRects(getNodesBounds(nodes), viewBB)
          : viewBB,
    };
  };
}

export function getXYWidthHeight({
  boundingRect,
  elementHeight,
  elementWidth,
  offsetScale,
}) {
  const scaledWidth = boundingRect.width / elementWidth;
  const scaledHeight = boundingRect.height / elementHeight;
  const viewScale = Math.max(scaledWidth, scaledHeight);
  const viewWidth = viewScale * elementWidth;
  const viewHeight = viewScale * elementHeight;
  const offset = offsetScale * viewScale;
  const x = boundingRect.x - (viewWidth - boundingRect.width) / 2 - offset;
  const y = boundingRect.y - (viewHeight - boundingRect.height) / 2 - offset;
  const width = viewWidth + offset * 2;
  const height = viewHeight + offset * 2;
  return { x, y, width, height, viewScale, offset };
}

function MiniMap({
  style,
  className,
  nodeStrokeColor = "transparent",
  nodeColor = "#e2e2e2",
  nodeClassName = "",
  nodeBorderRadius = 5,
  nodeStrokeWidth = 2,
  // We need to rename the prop to be `CapitalCase` so that JSX will render it as
  // a component properly.
  nodeComponent,
  maskColor = "rgb(240, 240, 240, 0.6)",
  maskStrokeColor = "none",
  maskStrokeWidth = 1,
  position = "bottom-right",
  onClick,
  onNodeClick,
  pannable = false,
  zoomable = false,
  inversePan = false,
  zoomStep = 10,
  offsetScale = 5,
}: MiniMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const nodes = useNodeInternals(getNodes, shallow);
  const [overviewWidth] = localStorageFns.overviewTrueWidth.hook();
  const { boundingRect, viewBB } = useReactFlow(
    getSelector(nodes, overviewWidth),
    shallow,
  );
  const elementWidth = (style?.width as number) ?? defaultWidth;
  const elementHeight = (style?.height as number) ?? defaultHeight;

  const { x, y, width, height, viewScale, offset } = getXYWidthHeight({
    boundingRect,
    elementHeight,
    elementWidth,
    offsetScale,
  });
  const viewScaleRef = useRef(0);

  viewScaleRef.current = viewScale;

  useEffect(() => {
    if (svgRef.current) {
      const selection = select(svgRef.current as Element);

      const zoomHandler = (event: D3ZoomEvent<SVGSVGElement, any>) => {
        const { transform, d3Selection, d3Zoom } = useReactFlow.getState();

        if (event.sourceEvent.type !== "wheel" || !d3Selection || !d3Zoom) {
          return;
        }

        const pinchDelta =
          -event.sourceEvent.deltaY *
          (event.sourceEvent.deltaMode === 1
            ? 0.05
            : event.sourceEvent.deltaMode
              ? 1
              : 0.002) *
          zoomStep;
        const zoom = transform[2] * Math.pow(2, pinchDelta);

        d3Zoom.scaleTo(d3Selection, zoom);
      };

      const panHandler = (event: D3ZoomEvent<HTMLDivElement, any>) => {
        const {
          transform,
          d3Selection,
          d3Zoom,
          translateExtent,
          width,
          height,
        } = useReactFlow.getState();

        if (event.sourceEvent.type !== "mousemove" || !d3Selection || !d3Zoom) {
          return;
        }

        const moveScale =
          viewScaleRef.current *
          Math.max(transform[2], Math.log(transform[2])) *
          (inversePan ? -1 : 1);
        const position = {
          x: transform[0] - event.sourceEvent.movementX * moveScale,
          y: transform[1] - event.sourceEvent.movementY * moveScale,
        };
        const extent: CoordinateExtent = [
          [0, 0],
          [width, height],
        ];

        const nextTransform = zoomIdentity
          .translate(position.x, position.y)
          .scale(transform[2]);
        const constrainedTransform = d3Zoom.constrain()(
          nextTransform,
          extent,
          translateExtent,
        );

        d3Zoom.transform(d3Selection, constrainedTransform);
      };

      const zoomAndPanHandler = zoom()
        // @ts-ignore
        .on("zoom", pannable ? panHandler : null)
        // @ts-ignore
        .on("zoom.wheel", zoomable ? zoomHandler : null);

      selection.call(zoomAndPanHandler);

      return () => {
        selection.on("zoom", null);
      };
    }
  }, [pannable, zoomable, inversePan, zoomStep]);

  const onSvgClick = onClick
    ? (event: MouseEvent) => {
        const rfCoord = pointer(event);
        onClick(event, {
          x: rfCoord[0] - localStorageFns.overviewTrueWidth.state()[0],
          y: rfCoord[1],
        });
      }
    : undefined;

  const onSvgNodeClick = onNodeClick
    ? (event: MouseEvent, nodeId: string) => {
        const node = useNodeInternals.getState().x.get(nodeId)!;
        onNodeClick(event, node);
      }
    : undefined;

  return (
    <Panel
      position={position}
      style={style}
      className={cc(["react-flow__minimap", className])}
      data-testid="rf__minimap"
    >
      <MinimapSvg
        elementWidth={elementWidth}
        elementHeight={elementHeight}
        x={x}
        y={y}
        width={width}
        height={height}
        svgRef={svgRef}
        onSvgClick={onSvgClick}
        onSvgNodeClick={onSvgNodeClick}
        nodeColor={nodeColor}
        nodeStrokeColor={nodeStrokeColor}
        nodeBorderRadius={nodeBorderRadius}
        nodeClassName={nodeClassName}
        nodeStrokeWidth={nodeStrokeWidth}
        nodeComponent={nodeComponent}
        offset={offset}
        viewBB={viewBB}
        maskColor={maskColor}
        maskStrokeColor={maskStrokeColor}
        maskStrokeWidth={maskStrokeWidth}
        nodes={null}
      />
    </Panel>
  );
}

MiniMap.displayName = "MiniMap";

export default memo(MiniMap);

export function MinimapSvg({
  elementWidth,
  elementHeight,
  x,
  y,
  width,
  height,
  svgRef,
  onSvgClick,
  onSvgNodeClick,
  nodeColor,
  nodeStrokeColor,
  nodeBorderRadius,
  nodeClassName,
  nodeStrokeWidth,
  nodeComponent,
  offset,
  viewBB,
  maskColor,
  maskStrokeColor,
  maskStrokeWidth,
  nodes,
}) {
  const minimapNodesProps = {
    onClick: onSvgNodeClick,
    nodeColor,
    nodeStrokeColor,
    nodeBorderRadius,
    nodeClassName,
    nodeStrokeWidth,
    nodeComponent,
  };

  return (
    <svg
      width={elementWidth}
      height={elementHeight}
      viewBox={`${x} ${y} ${width} ${height}`}
      role="img"
      ref={svgRef}
      onClick={onSvgClick}
    >
      {nodes ? (
        <MiniMapNodes nodes={nodes} {...minimapNodesProps} />
      ) : (
        <MiniMapNodesReactive {...minimapNodesProps} />
      )}
      {viewBB && (
        <path
          className="react-flow__minimap-mask"
          d={`M${x - offset},${y - offset}h${width + offset * 2}v${height + offset * 2}h${-width - offset * 2}z
M${viewBB.x},${viewBB.y}h${viewBB.width}v${viewBB.height}h${-viewBB.width}z`}
          fill={maskColor}
          fillRule="evenodd"
          stroke={maskStrokeColor}
          strokeWidth={maskStrokeWidth}
          pointerEvents="none"
        />
      )}
    </svg>
  );
}
