// useKonvaTransformer.js - Updated for dual-layer approach

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
        const resultLayer = konvaLayersRef.current[currentLayerId]?.result;

        if (resultLayer && resultLayer.isCached()) {
          resultLayer.clearCache();
        }
      });

      transformer.on("transform", () => {
        const currentLayerId = activeLayerIdRef.current;
        const resultLayer = konvaLayersRef.current[currentLayerId]?.result;

        if (resultLayer) {
          resultLayer.batchDraw();
        }
      });

      transformer.on("transformend", () => {
        const currentLayerId = activeLayerIdRef.current;
        const resultLayer = konvaLayersRef.current[currentLayerId]?.result;

        if (resultLayer) {
          updateLayerCache(currentLayerId);
        }
      });

      // Add to active layer's result layer
      const currentLayerId = activeLayerIdRef.current;
      const resultLayer = konvaLayersRef.current[currentLayerId]?.result;

      if (resultLayer) {
        resultLayer.add(transformer);
        transformer.moveToTop();
        transformerRef.current = transformer;

        // Reattach nodes if any were previously selected
        if (selectedNodesRef.current.length > 0) {
          transformer.nodes(selectedNodesRef.current);
          resultLayer.batchDraw(); // Force immediate draw
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

        // Add to active layer's result layer
        if (resultLayer) {
          resultLayer.add(selectionRect);
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

    // Make all lines in result layers draggable in edit mode, non-draggable otherwise
    Object.keys(konvaLayersRef.current).forEach((layerId) => {
      const resultLayer = konvaLayersRef.current[layerId]?.result;

      if (resultLayer) {
        const lines = resultLayer.find(".drawingLine");

        lines.forEach((line) => {
          line.draggable(mode === "edit");
        });

        // Redraw the layer
        resultLayer.batchDraw();
      }
    });

    // Redraw the active layer's result layer
    const currentLayerId = activeLayerIdRef.current;
    const resultLayer = konvaLayersRef.current[currentLayerId]?.result;

    if (resultLayer) {
      resultLayer.batchDraw();
    }
  }, [mode, activeLayerId]);
}

export function useEditModeEffects({
  mode,
  transformerRef,
  selectedNodesRef,
  konvaLayersRef,
}) {
  // Effect to handle mode changes and control transformer visibility
  useEffect(() => {
    // When switching from edit mode, clear selections
    if (mode !== "edit") {
      if (transformerRef.current) {
        transformerRef.current.nodes([]);
        selectedNodesRef.current = [];
      }
    }

    // Make all lines in result layers draggable in edit mode, non-draggable otherwise
    Object.keys(konvaLayersRef.current).forEach((layerId) => {
      const resultLayer = konvaLayersRef.current[layerId]?.result;

      if (resultLayer) {
        const lines = resultLayer.find(".drawingLine");

        lines.forEach((line) => {
          line.draggable(mode === "edit");
        });

        resultLayer.batchDraw();
      }
    });
  }, [mode]);
}
