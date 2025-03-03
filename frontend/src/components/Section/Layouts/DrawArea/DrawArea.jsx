import { useEffect, useRef, useState } from "react";
import { Layer, Line, Stage } from "react-konva";
import { useSectionInfos } from "state/definitions";
import { useDrawAreaActiveLayerAndLoadedArtifacts } from "state/hooks/artifacts";
import { setDrawAreaSectionSize } from "state/hooks/sectionSizes";
import { DrawAreaControls } from "./DrawAreaControls";

export function DrawArea({ sectionId }) {
  const stageRef = useRef(null);
  const [lines, setLines] = useState([]);
  const isDrawing = useRef(false);

  const {
    activeLayer,
    size: { width, height },
    canvasSettings: {
      activeLayerId,
      color,
      brushSize,
      brushShape,
      isEraser,
      eraserBrushSize,
      mode,
    },
  } = useDrawAreaActiveLayerAndLoadedArtifacts(sectionId);

  const layerOpacity = activeLayer?.layerOpacity ?? 1;
  const brushOpacity = activeLayer?.brushOpacity ?? 1;

  // Handle drawing mode
  useEffect(() => {
    if (!stageRef.current) return;

    const stage = stageRef.current;
    if (mode === "draw") {
      stage.container().style.cursor = "crosshair";
    } else {
      stage.container().style.cursor = "default";
    }
  }, [mode]);

  // Set initial default sizes to avoid "auto" errors with Konva
  const [stageSize, setStageSize] = useState({ width: 300, height: 200 });

  useEffect(() => {
    useSectionInfos.setState((state) => {
      const canvasSize = setDrawAreaSectionSize({
        sectionId,
        sectionHeight: height,
        sectionWidth: width,
        state,
      });

      if (
        typeof canvasSize.width === "number" &&
        typeof canvasSize.height === "number"
      ) {
        setStageSize({
          width: canvasSize.width,
          height: canvasSize.height,
        });
      }

      return state;
    });
  }, [width, height, sectionId]);

  const handleMouseDown = (e) => {
    if (mode !== "draw") return;

    isDrawing.current = true;
    const pos = e.target.getStage().getPointerPosition();
    setLines([
      ...lines,
      {
        points: [pos.x, pos.y],
        color: isEraser ? "#FFFFFF" : color,
        strokeWidth: isEraser ? eraserBrushSize : brushSize,
        opacity: brushOpacity,
        globalCompositeOperation: isEraser ? "destination-out" : "source-over",
      },
    ]);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing.current || mode !== "draw") return;

    const stage = e.target.getStage();
    const point = stage.getPointerPosition();

    // Update the last line
    const lastLine = lines[lines.length - 1];
    lastLine.points = lastLine.points.concat([point.x, point.y]);

    // Replace the last line
    lines.splice(lines.length - 1, 1, lastLine);
    setLines([...lines]);
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
  };

  return (
    <>
      <DrawAreaControls
        sectionId={sectionId}
        activeLayerId={activeLayerId}
        color={color}
        brushOpacity={brushOpacity}
        brushSize={brushSize}
        brushShape={brushShape}
        eraserBrushSize={eraserBrushSize}
        isEraser={isEraser}
        layerOpacity={layerOpacity}
        mode={mode}
      />
      <section className="nodrag single-cell-container section-row-main section-key-value relative max-h-full min-w-0">
        <div className="single-cell-child single-cell-container">
          <Stage
            width={stageSize.width}
            height={stageSize.height}
            ref={stageRef}
            onMouseDown={handleMouseDown}
            onMousemove={handleMouseMove}
            onMouseup={handleMouseUp}
            onMouseleave={handleMouseUp}
          >
            <Layer opacity={layerOpacity}>
              {lines.map((line, i) => (
                <Line
                  key={i}
                  points={line.points}
                  stroke={line.color}
                  strokeWidth={line.strokeWidth}
                  tension={0.5}
                  lineCap="round"
                  lineJoin="round"
                  opacity={line.opacity}
                  globalCompositeOperation={line.globalCompositeOperation}
                />
              ))}
            </Layer>
          </Stage>
        </div>
      </section>
    </>
  );
}
