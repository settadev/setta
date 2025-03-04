// utils.js - Updated for dual-layer approach

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

    // Add event handlers with improved caching approach
    line.on("transformstart", () => {
      const currentLayerId = activeLayerIdRef.current;
      const resultLayer = konvaLayersRef.current[currentLayerId]?.result;

      if (resultLayer && resultLayer.isCached()) {
        // Store cache state for later restoration
        line._layerWasCached = true;
        resultLayer.clearCache();
      } else {
        line._layerWasCached = false;
      }
    });

    line.on("transform", () => {
      // Force update during transformation without touching cache
      if (transformerRef.current) {
        transformerRef.current.forceUpdate();
      }
    });

    line.on("transformend", () => {
      const currentLayerId = activeLayerIdRef.current;

      // Defer cache update to next animation frame for better performance
      if (line._layerWasCached) {
        // Schedule update instead of doing it immediately
        requestAnimationFrame(() => {
          updateLayerCache(currentLayerId);
        });
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
    const layerPair = konvaLayersRef.current[currentLayerId];

    if (!layerPair) return;

    const activeLayer = layerPair.active;
    const resultLayer = layerPair.result;

    // First clear cache to avoid visual artifacts during clearing
    if (resultLayer.isCached()) {
      resultLayer.clearCache();
    }

    // Keep track of the transformer and selection rectangle
    let transformer = null;
    let selectionRect = null;

    if (modeRef.current === "edit") {
      // Save references if they exist
      if (transformerRef.current) {
        transformer = transformerRef.current;
        transformerRef.current = null;
      }

      if (selectionRectangleRef.current) {
        selectionRect = selectionRectangleRef.current;
        selectionRectangleRef.current = null;
      }
    }

    // Remove all line shapes from both active and result layers
    activeLayer.destroyChildren();
    resultLayer.destroyChildren();

    // Clear the stored references to lines for this layer
    layerLinesRef.current[currentLayerId] = {
      active: [],
      result: [],
    };

    // Recreate transformer if in edit mode
    if (modeRef.current === "edit") {
      const newTransformer = new Konva.Transformer({
        borderStroke: "#2196F3",
        borderStrokeWidth: 1,
        anchorStroke: "#2196F3",
        anchorFill: "#FFFFFF",
        anchorSize: 8,
        rotateAnchorOffset: 30,
        enabledAnchors: [
          "top-left",
          "top-center",
          "top-right",
          "middle-left",
          "middle-right",
          "bottom-left",
          "bottom-center",
          "bottom-right",
        ],
        rotationSnaps: [0, 45, 90, 135, 180, 225, 270, 315],
        padding: 5,
      });

      resultLayer.add(newTransformer);
      transformerRef.current = newTransformer;

      // Create selection rectangle
      const newSelectionRect = new Konva.Rect({
        fill: "rgba(0, 123, 255, 0.3)",
        stroke: "#2196F3",
        strokeWidth: 1,
        visible: false,
        listening: false,
      });

      resultLayer.add(newSelectionRect);
      selectionRectangleRef.current = newSelectionRect;
    }

    // Redraw both layers
    activeLayer.batchDraw();
    resultLayer.batchDraw();

    // Make sure the current line reference is cleared if it was on this layer
    if (
      lastLineRef.current &&
      (lastLineRef.current.parent === activeLayer ||
        lastLineRef.current.parent === resultLayer)
    ) {
      lastLineRef.current = null;
    }

    // Clear selection
    selectedNodesRef.current = [];
  };
}

export function createDeleteSelectedObjects({
  selectedNodesRef,
  activeLayerIdRef,
  layerLinesRef,
  transformerRef,
  konvaLayersRef,
  updateLayerCache,
}) {
  // Function to delete selected objects with deferred caching
  return () => {
    if (selectedNodesRef.current.length === 0) return;

    const currentLayerId = activeLayerIdRef.current;
    const layerPair = konvaLayersRef.current[currentLayerId];

    if (!layerPair) return;

    // In edit mode, we only work with the result layer
    const resultLayer = layerPair.result;

    // Clear cache before making changes for better performance
    if (resultLayer.isCached()) {
      resultLayer.clearCache();
    }

    // Remove selected nodes from the layer
    selectedNodesRef.current.forEach((node) => {
      // Also remove them from layerLinesRef
      if (layerLinesRef.current[currentLayerId]) {
        const nodeIndex = layerLinesRef.current[
          currentLayerId
        ].result.findIndex((line) => line === node);
        if (nodeIndex >= 0) {
          layerLinesRef.current[currentLayerId].result.splice(nodeIndex, 1);
        }
      }

      node.destroy();
    });

    // Clear selection
    selectedNodesRef.current = [];
    if (transformerRef.current) {
      transformerRef.current.nodes([]);
    }

    // Redraw the layer immediately for better visual feedback
    resultLayer.batchDraw();

    // Schedule cache update for the next frame
    requestAnimationFrame(() => {
      updateLayerCache(currentLayerId);
    });
  };
}

// Helper function to perform batch operations with proper caching
export function createBatchOperation(konvaLayersRef, updateLayerCache) {
  return (layerId, operation) => {
    const layerPair = konvaLayersRef.current[layerId];
    if (!layerPair) return;

    const resultLayer = layerPair.result;

    // Disable cache temporarily
    const wasCached = resultLayer.isCached();
    if (wasCached) {
      resultLayer.clearCache();
    }

    // Perform the operation
    operation(layerPair);

    // Immediate visual feedback
    layerPair.active.batchDraw();
    resultLayer.batchDraw();

    // Deferred cache update
    if (wasCached) {
      requestAnimationFrame(() => {
        updateLayerCache(layerId);
      });
    }
  };
}
