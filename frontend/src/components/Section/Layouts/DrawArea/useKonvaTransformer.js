import Konva from "konva";
import { useEffect } from "react";

export function useKonvaTransformer({
  stageRef,
  mode,
  konvaLayersRef,
  transformerRef,
  selectedNodesRef,
  selectionRectangleRef,
  activeLayerId,
  activeLayerIdRef,
  updateLayerCache,
}) {
  // Create and manage transformer based on mode
  useEffect(() => {
    if (!stageRef.current) return;

    // If we're entering edit mode, make sure transformer exists
    if (mode === "edit") {
      // Always recreate the transformer when entering edit mode
      // This ensures it's properly attached and visible
      if (transformerRef.current) {
        transformerRef.current.destroy();
      }

      const transformer = new Konva.Transformer({
        // Configure transformer appearance
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
          "middle-right",
          "middle-left",
          "bottom-left",
          "bottom-center",
          "bottom-right",
        ],
        rotationSnaps: [0, 45, 90, 135, 180, 225, 270, 315],
        padding: 5,
        // Better performance settings
        keepRatio: false,
        centeredScaling: false,
        boundBoxFunc: (oldBox, newBox) => newBox,
        // Set higher performance mode
        shouldOverdrawWholeArea: true,
        // Ensure changes apply immediately
        enabledTransformers: {
          rotation: true,
          resize: true,
          translate: true,
        },
      });

      // Add transform event listeners directly to transformer
      transformer.on("transformstart", () => {
        const currentLayerId = activeLayerIdRef.current;
        const currentLayer = konvaLayersRef.current[currentLayerId];
        if (currentLayer && currentLayer.isCached()) {
          currentLayer.clearCache();
        }
      });

      transformer.on("transform", () => {
        const currentLayerId = activeLayerIdRef.current;
        const currentLayer = konvaLayersRef.current[currentLayerId];
        if (currentLayer) {
          currentLayer.batchDraw();
        }
      });

      transformer.on("transformend", () => {
        const currentLayerId = activeLayerIdRef.current;
        const currentLayer = konvaLayersRef.current[currentLayerId];
        if (currentLayer) {
          updateLayerCache(currentLayerId);
        }
      });

      // Add to active layer
      const currentLayerId = activeLayerIdRef.current;
      const currentLayer = konvaLayersRef.current[currentLayerId];
      if (currentLayer) {
        currentLayer.add(transformer);
        transformer.moveToTop();
        transformerRef.current = transformer;

        // Reattach nodes if any were previously selected
        if (selectedNodesRef.current.length > 0) {
          transformer.nodes(selectedNodesRef.current);
          currentLayer.batchDraw(); // Force immediate draw
        }
      }

      // Create selection rectangle if it doesn't exist
      if (!selectionRectangleRef.current) {
        const selectionRect = new Konva.Rect({
          fill: "rgba(0, 123, 255, 0.3)",
          stroke: "#2196F3",
          strokeWidth: 1,
          visible: false,
          listening: false, // Don't interfere with other events
        });

        // Add to active layer
        const currentLayerId = activeLayerIdRef.current;
        const currentLayer = konvaLayersRef.current[currentLayerId];
        if (currentLayer) {
          currentLayer.add(selectionRect);
          selectionRectangleRef.current = selectionRect;
        }
      }
    } else {
      // If we're leaving edit mode, remove transformer and clear selections
      if (transformerRef.current) {
        transformerRef.current.nodes([]);
        transformerRef.current.destroy();
        transformerRef.current = null;
        selectedNodesRef.current = [];
      }

      // Also remove selection rectangle
      if (selectionRectangleRef.current) {
        selectionRectangleRef.current.destroy();
        selectionRectangleRef.current = null;
      }
    }

    // Make all lines draggable in edit mode, non-draggable otherwise
    Object.keys(konvaLayersRef.current).forEach((layerId) => {
      const layer = konvaLayersRef.current[layerId];
      const lines = layer.find(".drawingLine");

      lines.forEach((line) => {
        line.draggable(mode === "edit");
      });

      // Redraw the layer
      layer.batchDraw();
    });

    // Redraw the active layer
    const currentLayerId = activeLayerIdRef.current;
    const currentLayer = konvaLayersRef.current[currentLayerId];
    if (currentLayer) {
      currentLayer.batchDraw();
    }
  }, [mode, activeLayerId]);
}
