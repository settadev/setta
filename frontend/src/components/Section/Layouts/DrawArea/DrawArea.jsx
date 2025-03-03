import Konva from "konva";
import { useCallback, useEffect, useRef, useState } from "react";
import { DrawAreaControls } from "./DrawAreaControls";
import { useMouseHandlers } from "./mouseHandlers";
import { useKonvaStage } from "./useKonvaStage";
import { useEditModeEffects, useKonvaTransformer } from "./useKonvaTransformer";
import {
  useLayerCacheEffects,
  useUpdateKonvaLayers,
} from "./useUpdateKonvaLayers";
import { createPrepareLineForTransform } from "./utils";

export const DrawArea = () => {
  const containerRef = useRef(null);
  const [mode, setMode] = useState("brush"); // Now can be "brush", "eraser", or "edit"
  const [opacity, setOpacity] = useState(1);
  const [brushSize, setBrushSize] = useState(5);
  const [eraserSize, setEraserSize] = useState(20);
  const [brushColor, setBrushColor] = useState("#df4b26"); // Default red color
  const [layers, setLayers] = useState([
    { id: 1, name: "Layer 1", visible: true, opacity: 1 },
  ]);
  const [activeLayerId, setActiveLayerId] = useState(1);

  const stageRef = useRef(null);
  const konvaLayersRef = useRef({});
  const isPaintRef = useRef(false);
  const lastLineRef = useRef(null);
  // Store all lines for each layer to manage opacity
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
  const updateLayerCache = useCallback((layerId) => {
    const konvaLayer = konvaLayersRef.current[layerId];
    if (!konvaLayer) return;

    const layerData = layersRef.current.find((l) => l.id === layerId);
    if (!layerData) return;

    // Don't cache layers in edit mode to avoid transform problems
    const isEditMode = modeRef.current === "edit";

    // Reset all non-eraser lines to their original opacity first
    const layerLines = layerLinesRef.current[layerId] || [];
    layerLines.forEach((line) => {
      if (line.attrs.globalCompositeOperation !== "destination-out") {
        // Set each line to its original full opacity
        line.opacity(line.attrs._originalOpacity || 1);
      }
    });

    // First clear any existing cache
    konvaLayer.clearCache();

    // Apply the layer's opacity to the whole layer
    konvaLayer.opacity(layerData.opacity);

    // Cache the layer to ensure proper opacity rendering
    // Only cache if there's actual content in the layer and not in edit mode
    if (layerLines.length > 0 && !isEditMode) {
      // We need to calculate the bounding box of all shapes
      // or just use the stage dimensions for simplicity
      const stage = stageRef.current;
      if (stage) {
        konvaLayer.cache({
          x: 0,
          y: 0,
          width: stage.width(),
          height: stage.height(),
          pixelRatio: 1, // Using lower value for better performance
        });
      }
    }

    // Redraw the layer
    konvaLayer.batchDraw();
  }, []);

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
  });

  useUpdateKonvaLayers({
    stageRef,
    layers,
    konvaLayersRef,
    layerLinesRef,
    updateLayerCache,
  });

  // Layer management functions
  const addLayer = () => {
    const maxId = Math.max(0, ...layers.map((l) => l.id));
    const newLayer = {
      id: maxId + 1,
      name: `Layer ${maxId + 1}`,
      visible: true,
      opacity: 1,
    };

    setLayers([...layers, newLayer]);
    setActiveLayerId(newLayer.id);
  };

  const deleteLayer = (id) => {
    // Don't delete if it's the only layer
    if (layers.length <= 1) return;

    const newLayers = layers.filter((layer) => layer.id !== id);
    setLayers(newLayers);

    // If active layer was deleted, set the first available layer as active
    if (activeLayerId === id) {
      setActiveLayerId(newLayers[0].id);
    }
  };

  const toggleLayerVisibility = (id) => {
    setLayers(
      layers.map((layer) =>
        layer.id === id ? { ...layer, visible: !layer.visible } : layer,
      ),
    );
  };

  // Reorder layers function
  const reorderLayers = (fromIndex, toIndex) => {
    // Make sure indices are valid
    if (
      fromIndex < 0 ||
      fromIndex >= layers.length ||
      toIndex < 0 ||
      toIndex >= layers.length ||
      fromIndex === toIndex
    ) {
      return;
    }

    // Create a copy of the layers array
    const newLayers = [...layers];

    // Remove the layer from the fromIndex and insert it at toIndex
    const [movedLayer] = newLayers.splice(fromIndex, 1);
    newLayers.splice(toIndex, 0, movedLayer);

    // Update the layers state
    setLayers(newLayers);
  };

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

  const handleLayerOpacityChange = (id, newOpacity) => {
    setLayers(
      layers.map((layer) =>
        layer.id === id ? { ...layer, opacity: newOpacity } : layer,
      ),
    );
  };

  // Function to delete selected objects
  const deleteSelectedObjects = () => {
    if (selectedNodesRef.current.length === 0) return;

    const currentLayerId = activeLayerIdRef.current;

    // Remove selected nodes from the layer
    selectedNodesRef.current.forEach((node) => {
      // Also remove them from layerLinesRef
      if (layerLinesRef.current[currentLayerId]) {
        const nodeIndex = layerLinesRef.current[currentLayerId].findIndex(
          (line) => line === node,
        );
        if (nodeIndex >= 0) {
          layerLinesRef.current[currentLayerId].splice(nodeIndex, 1);
        }
      }

      node.destroy();
    });

    // Clear selection
    selectedNodesRef.current = [];
    if (transformerRef.current) {
      transformerRef.current.nodes([]);
    }

    // Redraw the layer
    if (konvaLayersRef.current[currentLayerId]) {
      konvaLayersRef.current[currentLayerId].batchDraw();
      updateLayerCache(currentLayerId);
    }
  };

  const clearStrokes = () => {
    const currentLayerId = activeLayerId;
    const konvaLayer = konvaLayersRef.current[currentLayerId];

    if (!konvaLayer) return;

    // Remove all line shapes from the Konva layer
    konvaLayer.destroyChildren();

    // Clear the stored references to lines for this layer
    layerLinesRef.current[currentLayerId] = [];

    // Clear the layer's cache
    konvaLayer.clearCache();

    // Recreate transformer if in edit mode
    if (mode === "edit") {
      const transformer = new Konva.Transformer({
        borderStroke: "#2196F3",
        borderStrokeWidth: 1,
        anchorStroke: "#2196F3",
        anchorFill: "#FFFFFF",
        anchorSize: 8,
        rotateAnchorOffset: 30,
        enabledAnchors: [
          "top-left",
          "top-right",
          "bottom-left",
          "bottom-right",
        ],
      });

      konvaLayer.add(transformer);
      transformerRef.current = transformer;

      // Create selection rectangle
      const selectionRect = new Konva.Rect({
        fill: "rgba(0, 123, 255, 0.3)",
        stroke: "#2196F3",
        strokeWidth: 1,
        visible: false,
        listening: false,
      });

      konvaLayer.add(selectionRect);
      selectionRectangleRef.current = selectionRect;
    }

    // Redraw the layer
    konvaLayer.batchDraw();

    // Make sure the current line reference is cleared if it was on this layer
    if (lastLineRef.current && lastLineRef.current.parent === konvaLayer) {
      lastLineRef.current = null;
    }

    // Clear selection
    selectedNodesRef.current = [];
  };

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
        onDeleteSelected={deleteSelectedObjects} // New prop for edit mode
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
