import _ from "lodash";
import { useEffect, useRef, useState } from "react";
import { listenForCanvasToBase64Requests } from "state/actions/temporaryMiscState";
import { useArtifacts, useMisc, useSectionInfos } from "state/definitions";
import {
  useDrawAreaActiveLayerAndLoadedArtifacts,
  useLoadArtifactViaDropzone,
} from "state/hooks/artifacts";
import useDeepCompareEffect, {
  useDeepCompareEffectNoCheck,
} from "use-deep-compare-effect";
import {
  drawAllLayers,
  setCanvasSize,
  setDraftCanvasProperties,
  setGlobalBrushStrokesAndDrawAllLayers,
} from "./canvasUtils";
import { DrawAreaControls } from "./DrawAreaControls";
import { useDrawModeMouseHandlers } from "./useDrawModeMouseHandlers";

export function DrawArea({ sectionId }) {
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

  const canvasRef = useRef(null);
  const draftCanvasRef = useRef(null);
  const tempCanvasRefs = useRef({ layer: null, artifact: null });
  const strokesRef = useRef([]);
  const eraserStrokesRef = useRef([]); // store in here until mouseup, then compute collisions with artifacts and store in localArtifactTransformsRef
  const localArtifactTransformsRef = useRef([]);
  const prevPointRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEraser, setIsEraser] = useState(false);
  const isDragging = useRef(false);
  const draggedIdx = useRef(null);
  const lastPos = useRef({ x: 0, y: 0 });
  const selectedIdx = useRef(null);
  const resizeHandle = useRef(null);
  const resizeHandleCorners = useRef(null);

  const layerOpacity = activeLayer?.layerOpacity ?? 1;
  const brushOpacity = activeLayer?.brushOpacity ?? 1;
  const currBrushStrokeArtifactId = activeLayer?.artifactTransforms?.find(
    (a) => loadedArtifacts[a.artifactId]?.type === "brushStrokes",
  )?.artifactId;

  const updateDrawAreas = useMisc((x) => x.updateDrawAreas);

  useEffect(() => {
    tempCanvasRefs.current.layer = document.createElement("canvas");
    tempCanvasRefs.current.artifact = document.createElement("canvas");

    const unsub = listenForCanvasToBase64Requests(sectionId, canvasRef);
    return unsub;
  }, []);

  useEffect(() => {
    useSectionInfos.setState((state) => {
      setCanvasSize({
        sectionId,
        canvasRef,
        tempCanvasRefs,
        draftCanvasRef,
        height,
        width,
        artifactIdUsedToSetCanvasSize,
        state,
      });
    });
    drawAllLayers(sectionId, canvasRef, tempCanvasRefs);
  }, [
    height,
    width,
    Boolean(loadedArtifacts[artifactIdUsedToSetCanvasSize]),
    updateDrawAreas,
  ]);
  // the Boolean dependency is checking whether or not the artifactIdUsedToSetCanvasSize has been loaded or not

  useEffect(() => {
    setDraftCanvasProperties({
      draftCanvasRef,
      color,
      brushSize,
      brushShape,
      brushOpacity,
      layerOpacity,
    });
  }, [
    color,
    brushSize,
    brushShape,
    brushOpacity,
    layerOpacity,
    updateDrawAreas,
  ]);

  useDeepCompareEffect(() => {
    if (mode === "draw") {
      selectedIdx.current = null;
      resizeHandleCorners.current = null;
    }
    drawAllLayers(sectionId, canvasRef, tempCanvasRefs);
  }, [
    mode,
    layerOpacity,
    allLayersMetadata,
    loadedArtifactIdsWithDuplicates,
    updateDrawAreas,
  ]);
  // loadedArtifactIdsWithDuplicates contains all artifacts ids present in all layers
  // including duplicates (e.g. the same artifact present multiple times in a single layer, or across multiple layers)

  useEffect(() => {
    if (!currBrushStrokeArtifactId) {
      strokesRef.current = [];
    } else {
      strokesRef.current = _.cloneDeep(
        useArtifacts.getState().x[currBrushStrokeArtifactId].value,
      );
    }
  }, [currBrushStrokeArtifactId, updateDrawAreas]);

  useDeepCompareEffectNoCheck(() => {
    if (!activeLayer?.artifactTransforms) {
      localArtifactTransformsRef.current = [];
    } else {
      localArtifactTransformsRef.current = _.cloneDeep(
        activeLayer.artifactTransforms,
      );
    }
  }, [activeLayer?.artifactTransforms, updateDrawAreas]);

  const { onMouseDown, onMouseMove, onMouseUp, onMouseEnter } =
    useDrawModeMouseHandlers({
      sectionId,
      isEraser,
      strokesRef,
      eraserStrokesRef,
      prevPointRef,
      eraserBrushSize,
      brushShape,
      isDrawing,
      setIsDrawing,
      isDragging,
      draggedIdx,
      lastPos,
      selectedIdx,
      resizeHandle,
      resizeHandleCorners,
      drawThrottleDelay,
      canvasRef,
      tempCanvasRefs,
      draftCanvasRef,
      canvasTransferQueueLength,
      currBrushStrokeArtifactId,
      activeLayerId,
      localArtifactTransformsRef,
      mode,
    });

  function clearStrokes() {
    strokesRef.current = [];
    setGlobalBrushStrokesAndDrawAllLayers(
      sectionId,
      currBrushStrokeArtifactId,
      strokesRef,
      canvasRef,
      tempCanvasRefs,
      draftCanvasRef,
    );
  }

  const { getRootProps, isDragActive } = useLoadArtifactViaDropzone(
    sectionId,
    true,
    "img",
  );

  const canvasClassName = `single-cell-child max-w-full place-self-center ${isDragActive ? "outline outline-4 outline-green-500 dark:outline-green-500/80" : ""}`;

  let cursorIcon;
  if (mode === "edit") {
    cursorIcon = "cursor-pointer";
  } else if (isEraser) {
    cursorIcon = "cursor-[url(./src/assets/cursor/erase.svg)_0_24,_pointer]";
  } else {
    cursorIcon = "cursor-[url(./src/assets/cursor/pen.svg)_0_24,_pointer]";
  }

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
        clearStrokes={clearStrokes}
      />
      <section
        className="nodrag single-cell-container section-row-main section-key-value relative max-h-full min-w-0"
        {...getRootProps()}
      >
        <div className="single-cell-child single-cell-container">
          <canvas
            ref={canvasRef}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onMouseEnter={onMouseEnter}
            className={`${cursorIcon} ${canvasClassName}`}
          />
          <canvas
            ref={draftCanvasRef}
            className={`pointer-events-none ${canvasClassName}`}
          />
        </div>
      </section>
    </>
  );
}
