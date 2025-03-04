// useKonvaStage.js - Updated for dual-layer approach

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
  mergeActiveToResult,
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

    // Improved drag handling with deferred caching - only affects result layer
    stage.on("dragstart", (e) => {
      // Only handle lines in edit mode
      if (modeRef.current !== "edit" || e.target.name() !== "drawingLine")
        return;

      // Disable caching during drag operations
      const currentLayerId = activeLayerIdRef.current;
      const resultLayer = konvaLayersRef.current[currentLayerId]?.result;

      if (resultLayer) {
        // Store cache state to restore later
        e.target._cacheEnabled = resultLayer.isCached();
        if (e.target._cacheEnabled) {
          resultLayer.clearCache();
        }
      }
    });

    stage.on("dragmove", (e) => {
      // Only handle lines in edit mode
      if (modeRef.current !== "edit" || e.target.name() !== "drawingLine")
        return;

      // Simple redraw during drag - don't touch caching
      const currentLayerId = activeLayerIdRef.current;
      const resultLayer = konvaLayersRef.current[currentLayerId]?.result;

      if (resultLayer) {
        // Force immediate redraw for smooth movement
        resultLayer.batchDraw();

        // Update transformer position if the line is selected
        if (
          transformerRef.current &&
          selectedNodesRef.current.includes(e.target)
        ) {
          transformerRef.current.forceUpdate();
        }
      }
    });

    stage.on("dragend", (e) => {
      // Only handle lines in edit mode
      if (modeRef.current !== "edit" || e.target.name() !== "drawingLine")
        return;

      // Deferred cache update after drag completes
      const currentLayerId = activeLayerIdRef.current;
      const resultLayer = konvaLayersRef.current[currentLayerId]?.result;

      if (resultLayer) {
        // Cancel any pending cache updates
        if (resultLayer._cacheUpdateTimer) {
          cancelAnimationFrame(resultLayer._cacheUpdateTimer);
        }

        // Schedule cache update in next frame
        resultLayer._cacheUpdateTimer = requestAnimationFrame(() => {
          // Only restore cache if it was enabled before
          if (e.target._cacheEnabled) {
            updateLayerCache(currentLayerId);
          }
          resultLayer._cacheUpdateTimer = null;
        });

        // Force immediate draw for better responsiveness
        resultLayer.batchDraw();
      }
    });

    // Improved transform handling
    stage.on("transformstart", (e) => {
      // Only handle in edit mode
      if (modeRef.current !== "edit") return;

      // Disable caching during transform operations
      const currentLayerId = activeLayerIdRef.current;
      const resultLayer = konvaLayersRef.current[currentLayerId]?.result;

      if (resultLayer) {
        // Store cache state to restore later
        resultLayer._cacheEnabled = resultLayer.isCached();
        if (resultLayer._cacheEnabled) {
          resultLayer.clearCache();
        }
      }
    });

    stage.on("transform", (e) => {
      // Only handle in edit mode
      if (modeRef.current !== "edit") return;

      // Keep transforms smooth by avoiding cache manipulation
      const currentLayerId = activeLayerIdRef.current;
      const resultLayer = konvaLayersRef.current[currentLayerId]?.result;

      if (resultLayer) {
        // Force immediate redraw for live updates
        resultLayer.batchDraw();
      }
    });

    stage.on("transformend", (e) => {
      // Only handle in edit mode
      if (modeRef.current !== "edit") return;

      // Deferred cache update after transform
      const currentLayerId = activeLayerIdRef.current;
      const resultLayer = konvaLayersRef.current[currentLayerId]?.result;

      if (resultLayer) {
        // Cancel any pending cache updates
        if (resultLayer._cacheUpdateTimer) {
          cancelAnimationFrame(resultLayer._cacheUpdateTimer);
        }

        // Schedule cache update in next frame
        resultLayer._cacheUpdateTimer = requestAnimationFrame(() => {
          // Only restore cache if it was enabled before
          if (resultLayer._cacheEnabled) {
            updateLayerCache(currentLayerId);
          }
          resultLayer._cacheUpdateTimer = null;
        });

        // Force immediate draw for better responsiveness
        resultLayer.batchDraw();
      }
    });

    // Initial layer - create both active and result layers
    const activeLayer = new Konva.Layer({ name: "active-layer-1" });
    const resultLayer = new Konva.Layer({ name: "result-layer-1" });

    stage.add(resultLayer);
    stage.add(activeLayer);

    konvaLayersRef.current[1] = {
      active: activeLayer,
      result: resultLayer,
    };

    layerLinesRef.current[1] = {
      active: [],
      result: [],
    };

    // Improved resize handling with debouncing
    const resizeHandler = debounce(() => {
      if (containerRef.current && stageRef.current) {
        stageRef.current.width(containerRef.current.offsetWidth);
        stageRef.current.height(containerRef.current.offsetHeight);

        // Schedule cache updates with a delay between each layer
        let delay = 0;
        Object.keys(konvaLayersRef.current).forEach((layerId) => {
          setTimeout(() => {
            updateLayerCache(parseInt(layerId, 10));
          }, delay);
          delay += 50; // Stagger updates by 50ms
        });
      }
    }, 100); // Debounce resize events to avoid excessive updates

    const resizeObserver = new ResizeObserver(resizeHandler);
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      // Clean up any pending animations
      Object.values(konvaLayersRef.current).forEach((layerPair) => {
        if (layerPair.result._cacheUpdateTimer) {
          cancelAnimationFrame(layerPair.result._cacheUpdateTimer);
        }
      });

      // Clean up Konva stage if it exists
      if (stageRef.current) {
        stageRef.current.destroy();
      }
    };
  }, [
    handleMouseDown,
    handleMouseUp,
    handleMouseMove,
    updateLayerCache,
    mergeActiveToResult,
  ]);
}

// Utility debounce function for resize handling
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
