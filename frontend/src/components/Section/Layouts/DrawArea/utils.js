export function createPrepareLineForTransform(
  activeLayerIdRef,
  konvaLayersRef,
  transformerRef,
  updateLayerCache,
) {
  return (line) => {
    // Ensure the line has all transform-related properties set
    line.transformsEnabled("all");
    line.draggable(true);

    // Add event handlers directly to the line for better transform interaction
    line.on("transformstart", () => {
      const currentLayerId = activeLayerIdRef.current;
      const currentLayer = konvaLayersRef.current[currentLayerId];
      if (currentLayer && currentLayer.isCached()) {
        currentLayer.clearCache();
      }
    });

    line.on("transform", () => {
      // Force update during transformation
      if (transformerRef.current) {
        transformerRef.current.forceUpdate();
      }
    });

    line.on("transformend", () => {
      const currentLayerId = activeLayerIdRef.current;
      const currentLayer = konvaLayersRef.current[currentLayerId];
      if (currentLayer) {
        updateLayerCache(currentLayerId);
      }
    });
  };
}

export function createClearStrokes({
  activeLayerIdRef,
  konvaLayersRef,
  layerLinesRef,
  modeRef,
  transformerRef,
  selectionRectangleRef,
  lastLineRef,
  selectedNodesRef,
}) {
  return () => {
    const currentLayerId = activeLayerIdRef.current;
    const konvaLayer = konvaLayersRef.current[currentLayerId];

    if (!konvaLayer) return;

    // Remove all line shapes from the Konva layer
    konvaLayer.destroyChildren();

    // Clear the stored references to lines for this layer
    layerLinesRef.current[currentLayerId] = [];

    // Clear the layer's cache
    konvaLayer.clearCache();

    // Recreate transformer if in edit mode
    if (modeRef.current === "edit") {
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
}
