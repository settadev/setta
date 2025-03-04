// DrawArea.jsx - Updated for dual-layer approach

import { useEffect, useRef, useState } from "react";
import { DrawAreaControls } from "./DrawAreaControls";
import { useMouseHandlers } from "./mouseHandlers";
import { useKonvaStage } from "./useKonvaStage";
import { useEditModeEffects, useKonvaTransformer } from "./useKonvaTransformer";
import {
  getLayerManagementFns,
  useLayerCache,
  useLayerCacheEffects,
  useMergeActiveToResult,
  useUpdateKonvaLayers,
} from "./useUpdateKonvaLayers";
import {
  createClearStrokes,
  createDeleteSelectedObjects,
  createPrepareLineForTransform,
} from "./utils";

export const DrawArea = () => {
  const containerRef = useRef(null);
  const [mode, setMode] = useState("brush"); // Can be "brush", "eraser", or "edit"
  const [opacity, setOpacity] = useState(1);
  const [brushSize, setBrushSize] = useState(5);
  const [eraserSize, setEraserSize] = useState(20);
  const [brushColor, setBrushColor] = useState("#df4b26"); // Default red color
  const [layers, setLayers] = useState([
    { id: 1, name: "Layer 1", visible: true, opacity: 1 },
  ]);
  const [activeLayerId, setActiveLayerId] = useState(1);

  const stageRef = useRef(null);
  // Modified to store both active and result layers
  const konvaLayersRef = useRef({});
  const isPaintRef = useRef(false);
  const lastLineRef = useRef(null);
  // Modified to store active and result lines separately
  const layerLinesRef = useRef({});
  // Reference for transformer
  const transformerRef = useRef(null);
  // Selected nodes reference
  const selectedNodesRef = useRef([]);

  // Selection rectangle related refs
  const selectionRectangleRef = useRef(null);
  const selectionStartRef = useRef({ x: 0, y: 0 });
  const isSelectingRef = useRef(false);

  // Use refs to track current values during events
  const modeRef = useRef(mode);
  const opacityRef = useRef(opacity);
  const brushSizeRef = useRef(brushSize);
  const eraserSizeRef = useRef(eraserSize);
  const brushColorRef = useRef(brushColor);
  const activeLayerIdRef = useRef(activeLayerId);
  const layersRef = useRef(layers);

  // Update the refs whenever values change
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);
  useEffect(() => {
    opacityRef.current = opacity;
  }, [opacity]);
  useEffect(() => {
    brushSizeRef.current = brushSize;
  }, [brushSize]);
  useEffect(() => {
    eraserSizeRef.current = eraserSize;
  }, [eraserSize]);
  useEffect(() => {
    brushColorRef.current = brushColor;
  }, [brushColor]);
  useEffect(() => {
    activeLayerIdRef.current = activeLayerId;
  }, [activeLayerId]);
  useEffect(() => {
    layersRef.current = layers;
  }, [layers]);

  // Function to update layer's cache and opacity
  const updateLayerCache = useLayerCache({
    konvaLayersRef,
    layersRef,
    layerLinesRef,
    modeRef,
    stageRef,
  });

  // New function to merge from active to result layer
  const mergeActiveToResult = useMergeActiveToResult({
    konvaLayersRef,
    layerLinesRef,
    layersRef, // Pass layersRef to access layer opacity
    updateLayerCache,
  });

  useKonvaTransformer({
    stageRef,
    mode,
    konvaLayersRef,
    transformerRef,
    selectedNodesRef,
    selectionRectangleRef,
    activeLayerId,
    activeLayerIdRef,
    updateLayerCache,
  });

  useLayerCacheEffects({ mode, layers, konvaLayersRef, updateLayerCache });

  useEditModeEffects({
    mode,
    transformerRef,
    selectedNodesRef,
    konvaLayersRef,
  });

  const prepareLineForTransform = createPrepareLineForTransform(
    activeLayerIdRef,
    konvaLayersRef,
    transformerRef,
    updateLayerCache,
  );

  const { handleMouseDown, handleMouseMove, handleMouseUp } = useMouseHandlers({
    stageRef,
    modeRef,
    activeLayerIdRef,
    konvaLayersRef,
    isSelectingRef,
    selectionStartRef,
    selectionRectangleRef,
    transformerRef,
    selectedNodesRef,
    isPaintRef,
    opacityRef,
    brushSizeRef,
    eraserSizeRef,
    brushColorRef,
    lastLineRef,
    layerLinesRef,
    layersRef,
    updateLayerCache,
    prepareLineForTransform,
    mergeActiveToResult, // Pass the new function
  });

  useKonvaStage({
    containerRef,
    stageRef,
    modeRef,
    activeLayerIdRef,
    konvaLayersRef,
    layerLinesRef,
    transformerRef,
    selectedNodesRef,
    handleMouseDown,
    handleMouseUp,
    handleMouseMove,
    updateLayerCache,
    mergeActiveToResult, // Pass the new function
  });

  useUpdateKonvaLayers({
    stageRef,
    layers,
    konvaLayersRef,
    layerLinesRef,
    updateLayerCache,
  });

  // Control handlers
  const handleToolChange = (value) => {
    setMode(value);
  };

  const handleOpacityChange = (value) => {
    setOpacity(value);
  };

  const handleBrushSizeChange = (value) => {
    setBrushSize(value);
  };

  const handleEraserSizeChange = (value) => {
    setEraserSize(value);
  };

  const handleColorChange = (value) => {
    setBrushColor(value);
  };

  const {
    addLayer,
    deleteLayer,
    toggleLayerVisibility,
    reorderLayers,
    handleLayerOpacityChange,
  } = getLayerManagementFns({
    layers,
    setLayers,
    activeLayerId,
    setActiveLayerId,
    updateLayerCache,
  });

  const deleteSelectedObjects = createDeleteSelectedObjects({
    selectedNodesRef,
    activeLayerIdRef,
    layerLinesRef,
    transformerRef,
    konvaLayersRef,
    updateLayerCache,
  });

  const clearStrokes = createClearStrokes({
    activeLayerIdRef,
    konvaLayersRef,
    layerLinesRef,
    modeRef,
    transformerRef,
    selectionRectangleRef,
    lastLineRef,
    selectedNodesRef,
  });

  return (
    <>
      {/* Pass all control-related props to the DrawControls component */}
      <DrawAreaControls
        mode={mode}
        opacity={opacity}
        brushSize={brushSize}
        eraserSize={eraserSize}
        brushColor={brushColor}
        layers={layers}
        activeLayerId={activeLayerId}
        onToolChange={handleToolChange}
        onOpacityChange={handleOpacityChange}
        onBrushSizeChange={handleBrushSizeChange}
        onEraserSizeChange={handleEraserSizeChange}
        onColorChange={handleColorChange}
        onLayerOpacityChange={handleLayerOpacityChange}
        onAddLayer={addLayer}
        onDeleteLayer={deleteLayer}
        onToggleLayerVisibility={toggleLayerVisibility}
        onSelectLayer={setActiveLayerId}
        onReorderLayers={reorderLayers}
        clearStrokes={clearStrokes}
        onDeleteSelected={deleteSelectedObjects} // For edit mode
      />
      <section className="nodrag single-cell-container section-row-main section-key-value relative max-h-full min-w-0">
        <div className="single-cell-child single-cell-container">
          <div
            ref={containerRef}
            className="single-cell-child max-w-full place-self-center"
            style={{ touchAction: mode === "edit" ? "auto" : "none" }}
          />
        </div>
      </section>
    </>
  );
};
