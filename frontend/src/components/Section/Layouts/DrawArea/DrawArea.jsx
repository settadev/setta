import * as fabric from "fabric";
import { useEffect, useRef, useState } from "react";
import { useSectionInfos } from "state/definitions";
import { useDrawAreaActiveLayerAndLoadedArtifacts } from "state/hooks/artifacts";
import { setCanvasSize } from "./canvasUtils";
import { DrawAreaControls } from "./DrawAreaControls";

export function DrawArea({ sectionId }) {
  const canvasRef = useRef(null);
  const fabricCanvas = useRef(null);
  const {
    activeLayer,
    allLayersMetadata,
    size: { width, height },
    canvasSettings: {
      activeLayerId,
      color,
      brushSize,
      brushShape,
      eraserBrushSize,
      drawThrottleDelay,
      canvasTransferQueueLength,
      mode,
      artifactIdUsedToSetCanvasSize,
    },
    loadedArtifacts,
    loadedArtifactIdsWithDuplicates,
  } = useDrawAreaActiveLayerAndLoadedArtifacts(sectionId);

  const [isEraser, setIsEraser] = useState(false);
  const layerOpacity = activeLayer?.layerOpacity ?? 1;
  const brushOpacity = activeLayer?.brushOpacity ?? 1;

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }

    fabricCanvas.current = new fabric.Canvas(canvasRef.current, {});

    return () => {
      // `dispose` is async
      // however it runs a sync DOM cleanup
      // its async part ensures rendering has completed
      // and should not affect react
      fabricCanvas.current.dispose();
    };
  }, [canvasRef]);

  useEffect(() => {
    if (!fabricCanvas.current) {
      return;
    }
    useSectionInfos.setState((state) =>
      setCanvasSize({
        sectionId,
        canvas: fabricCanvas.current,
        height,
        width,
        state,
      }),
    );
  }, [width, height]);

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
        setIsEraser={setIsEraser}
        layerOpacity={layerOpacity}
        mode={mode}
        // clearStrokes={clearStrokes}
      />
      <section className="nodrag single-cell-container section-row-main section-key-value relative max-h-full min-w-0">
        <div className="single-cell-child single-cell-container">
          <canvas ref={canvasRef} />
        </div>
      </section>
    </>
  );
}
