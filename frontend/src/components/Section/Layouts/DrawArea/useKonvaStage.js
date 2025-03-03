import Konva from "konva";
import { useEffect } from "react";

export function useKonvaStage({
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
}) {
  // Initialize the stage and layers
  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize Konva stage
    const stage = new Konva.Stage({
      container: containerRef.current,
      width: 500,
      height: 500,
    });

    stageRef.current = stage;

    // Add event listeners to stage
    stage.on("mousedown touchstart", handleMouseDown);
    stage.on("mouseup touchend", handleMouseUp);
    stage.on("mousemove touchmove", handleMouseMove);

    // Add these new event handlers for drag operations
    stage.on("dragstart", (e) => {
      // Only handle lines in edit mode
      if (modeRef.current !== "edit" || e.target.name() !== "drawingLine")
        return;

      // Important: When starting a drag, disable caching temporarily
      const currentLayerId = activeLayerIdRef.current;
      const currentLayer = konvaLayersRef.current[currentLayerId];
      if (currentLayer) {
        // Store cache state to restore later
        e.target._cacheEnabled = currentLayer.isCached();
        if (e.target._cacheEnabled) {
          currentLayer.clearCache();
        }
      }
    });

    stage.on("dragmove", (e) => {
      // Only handle lines in edit mode
      if (modeRef.current !== "edit" || e.target.name() !== "drawingLine")
        return;

      // Make sure the layer updates during drag - key change: disable caching temporarily
      const currentLayerId = activeLayerIdRef.current;
      const currentLayer = konvaLayersRef.current[currentLayerId];
      if (currentLayer) {
        // Temporarily disable caching during drag for live updates
        const wasCached = currentLayer.isCached();
        if (wasCached) {
          currentLayer.clearCache();
        }

        // Force immediate redraw to see live movement
        currentLayer.draw();

        // Update transformer position if the line is selected
        if (
          transformerRef.current &&
          selectedNodesRef.current.includes(e.target)
        ) {
          transformerRef.current.forceUpdate();
          transformerRef.current.moveToTop();
        }
      }
    });

    stage.on("dragend", (e) => {
      // Only handle lines in edit mode
      if (modeRef.current !== "edit" || e.target.name() !== "drawingLine")
        return;

      // Update the cache after drag completes
      const currentLayerId = activeLayerIdRef.current;
      const currentLayer = konvaLayersRef.current[currentLayerId];
      if (currentLayer) {
        // Force immediate draw first
        currentLayer.draw();

        // Restore cache if it was enabled
        if (e.target._cacheEnabled) {
          updateLayerCache(currentLayerId);
        }

        // Update transformer position
        if (
          transformerRef.current &&
          selectedNodesRef.current.includes(e.target)
        ) {
          transformerRef.current.forceUpdate();
          transformerRef.current.moveToTop();
          currentLayer.draw(); // Another draw to ensure transformer is visible
        }
      }
    });

    stage.on("transformstart", (e) => {
      // Only handle in edit mode
      if (modeRef.current !== "edit") return;

      // Disable caching during transform operations
      const currentLayerId = activeLayerIdRef.current;
      const currentLayer = konvaLayersRef.current[currentLayerId];
      if (currentLayer) {
        // Store cache state to restore later
        currentLayer._cacheEnabled = currentLayer.isCached();
        if (currentLayer._cacheEnabled) {
          currentLayer.clearCache();
        }
      }
    });

    stage.on("transform", (e) => {
      // Only handle in edit mode
      if (modeRef.current !== "edit") return;

      // Make sure the layer updates during transform
      const currentLayerId = activeLayerIdRef.current;
      const currentLayer = konvaLayersRef.current[currentLayerId];
      if (currentLayer) {
        // Force immediate redraw for live updates
        currentLayer.batchDraw();
      }
    });

    stage.on("transformend", (e) => {
      // Only handle in edit mode
      if (modeRef.current !== "edit") return;

      // Update the cache after transform completes
      const currentLayerId = activeLayerIdRef.current;
      const currentLayer = konvaLayersRef.current[currentLayerId];
      if (currentLayer) {
        // Force immediate draw first
        currentLayer.batchDraw();

        // Restore cache if it was enabled
        if (currentLayer._cacheEnabled) {
          updateLayerCache(currentLayerId);
        }
      }
    });

    // Initial layer
    const layer = new Konva.Layer();
    stage.add(layer);
    konvaLayersRef.current[1] = layer;
    layerLinesRef.current[1] = [];

    // Handle window resize
    const resizeObserver = new ResizeObserver(() => {
      if (containerRef.current) {
        stage.width(containerRef.current.offsetWidth);
        stage.height(containerRef.current.offsetHeight);

        // Update all caches when resizing
        Object.keys(konvaLayersRef.current).forEach((layerId) => {
          updateLayerCache(parseInt(layerId, 10));
        });
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      // Clean up Konva stage if it exists
      if (stageRef.current) {
        stageRef.current.destroy();
      }
    };
  }, [handleMouseDown, handleMouseUp, handleMouseMove, updateLayerCache]);
}
