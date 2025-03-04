// useUpdateKonvaLayers.js - Updated for dual-layer approach

import Konva from "konva";
import { useCallback, useEffect } from "react";

export function useUpdateKonvaLayers({
  stageRef,
  layers,
  konvaLayersRef,
  layerLinesRef,
  updateLayerCache,
}) {
  // Improved layer management with dual-layer approach
  useEffect(() => {
    if (!stageRef.current) return;

    // Track which layers need cache updates
    const layersToUpdate = new Set();

    // Create new layers if needed
    layers.forEach((layer) => {
      if (!konvaLayersRef.current[layer.id]) {
        // Create two layers for each logical layer:
        // 1. Active layer for drawing (always uncached)
        const activeLayer = new Konva.Layer({
          name: `active-layer-${layer.id}`,
          listening: true,
        });

        // 2. Result layer for completed strokes (cached)
        const resultLayer = new Konva.Layer({
          name: `result-layer-${layer.id}`,
        });

        // Add both layers to stage
        stageRef.current.add(resultLayer);
        stageRef.current.add(activeLayer);

        // Store both layers in the ref
        konvaLayersRef.current[layer.id] = {
          active: activeLayer,
          result: resultLayer,
        };

        layerLinesRef.current[layer.id] = {
          active: [],
          result: [],
        };

        // New layers need cache initialization
        layersToUpdate.add(layer.id);
      }

      // Update visibility for both active and result layers
      konvaLayersRef.current[layer.id].active.visible(layer.visible);
      konvaLayersRef.current[layer.id].result.visible(layer.visible);
    });

    // Remove deleted layers
    Object.keys(konvaLayersRef.current).forEach((layerId) => {
      const numLayerId = parseInt(layerId, 10);
      if (!layers.some((l) => l.id === numLayerId)) {
        // Destroy both layers
        konvaLayersRef.current[layerId].active.destroy();
        konvaLayersRef.current[layerId].result.destroy();
        delete konvaLayersRef.current[layerId];
        delete layerLinesRef.current[layerId];
      }
    });

    // Make sure the layers are in the correct order
    layers.forEach((layer, index) => {
      const layerPair = konvaLayersRef.current[layer.id];
      const activeIndex = layerPair.active.zIndex();
      const resultIndex = layerPair.result.zIndex();

      // Each logical layer uses two z-index positions
      // Result layer comes first, then active layer on top
      const targetResultIndex = index * 2;
      const targetActiveIndex = index * 2 + 1;

      if (resultIndex !== targetResultIndex) {
        layerPair.result.setZIndex(targetResultIndex);
        layersToUpdate.add(layer.id);
      }

      if (activeIndex !== targetActiveIndex) {
        layerPair.active.setZIndex(targetActiveIndex);
        layersToUpdate.add(layer.id);
      }
    });

    // Stagger cache updates for better performance
    if (layersToUpdate.size > 0) {
      let delay = 0;
      layersToUpdate.forEach((layerId) => {
        setTimeout(() => {
          updateLayerCache(layerId);
        }, delay);
        delay += 50; // 50ms between updates
      });
    }
  }, [layers, updateLayerCache]);
}

export function useLayerCache({
  konvaLayersRef,
  layersRef,
  layerLinesRef,
  modeRef,
  stageRef,
}) {
  return useCallback((layerId) => {
    const layerPair = konvaLayersRef.current[layerId];
    if (!layerPair) return;

    const layerData = layersRef.current.find((l) => l.id === layerId);
    if (!layerData) return;

    // Only cache the result layer - active layer remains uncached
    const resultLayer = layerPair.result;

    // Skip caching in edit mode to avoid transform issues
    const isEditMode = modeRef.current === "edit";
    if (isEditMode) {
      resultLayer.clearCache();
      resultLayer.opacity(layerData.opacity);
      resultLayer.batchDraw();
      return;
    }

    // Skip if no lines in the result layer (nothing to cache)
    const resultLines = layerLinesRef.current[layerId]?.result || [];
    if (resultLines.length === 0) {
      resultLayer.opacity(layerData.opacity);
      resultLayer.batchDraw();
      return;
    }

    // Clear any existing cache
    resultLayer.clearCache();

    // Instead of applying opacity to the whole layer (which affects erasers),
    // we'll apply opacity individually to each non-eraser line
    resultLines.forEach((line) => {
      if (line.attrs.globalCompositeOperation !== "destination-out") {
        // Set non-eraser lines to their original opacity multiplied by layer opacity
        line.opacity((line.attrs._originalOpacity || 1) * layerData.opacity);
      } else {
        // Ensure eraser lines always have full opacity
        line.opacity(1);
      }
    });

    // Set layer opacity to 1 - we're managing opacity on individual lines now
    resultLayer.opacity(1);

    // Get stage dimensions for caching
    const stage = stageRef.current;
    if (!stage) return;

    // Calculate optimal pixel ratio - balance between quality and performance
    const optimalPixelRatio = Math.min(1.5, window.devicePixelRatio || 1);

    // Cache with optimized settings
    resultLayer.cache({
      x: 0,
      y: 0,
      width: stage.width(),
      height: stage.height(),
      pixelRatio: optimalPixelRatio,
      imageSmoothingEnabled: true,
    });

    // Final draw to apply changes
    resultLayer.batchDraw();
  }, []);
}

// Function to merge from active layer to result layer
export function useMergeActiveToResult({
  konvaLayersRef,
  layerLinesRef,
  layersRef,
  updateLayerCache,
}) {
  return useCallback((layerId) => {
    const layerPair = konvaLayersRef.current[layerId];
    if (!layerPair) return;

    const activeLayer = layerPair.active;
    const resultLayer = layerPair.result;

    // Get all the active lines
    const activeLines = layerLinesRef.current[layerId]?.active || [];
    if (activeLines.length === 0) return;

    // Get the current layer data for opacity calculation
    const layerData = layersRef.current.find((l) => l.id === layerId);
    const layerOpacity = layerData?.opacity || 1;

    // Clone each active line and move it to the result layer
    activeLines.forEach((activeLine) => {
      const clonedLine = activeLine.clone();

      // Update opacity based on layer opacity if not an eraser
      if (clonedLine.attrs.globalCompositeOperation !== "destination-out") {
        const originalOpacity = clonedLine.attrs._originalOpacity || 1;
        // Apply layer opacity to the line directly
        clonedLine.opacity(originalOpacity * layerOpacity);
      }

      resultLayer.add(clonedLine);

      // Add the cloned line to the result lines array
      layerLinesRef.current[layerId].result.push(clonedLine);
    });

    // Clear the active layer
    activeLayer.destroyChildren();
    layerLinesRef.current[layerId].active = [];

    // Update cache for the result layer
    updateLayerCache(layerId);

    // Redraw both layers
    activeLayer.batchDraw();
    resultLayer.batchDraw();
  }, []);
}

// Deferred layer cache updater
export function useDeferredLayerCache({
  konvaLayersRef,
  layersRef,
  layerLinesRef,
  modeRef,
  stageRef,
}) {
  const updateLayerCache = useLayerCache({
    konvaLayersRef,
    layersRef,
    layerLinesRef,
    modeRef,
    stageRef,
  });

  return useCallback(
    (layerId, immediate = false) => {
      const layerPair = konvaLayersRef.current[layerId];
      if (!layerPair) return;

      // Only apply caching to the result layer
      const resultLayer = layerPair.result;

      // If already scheduled, cancel it
      if (resultLayer._cacheUpdateTimer) {
        cancelAnimationFrame(resultLayer._cacheUpdateTimer);
      }

      if (immediate) {
        // Update immediately
        updateLayerCache(layerId);
      } else {
        // Schedule update for next animation frame
        resultLayer._cacheUpdateTimer = requestAnimationFrame(() => {
          updateLayerCache(layerId);
          resultLayer._cacheUpdateTimer = null;
        });
      }
    },
    [updateLayerCache],
  );
}

// Optimized effect for layer cache updates
export function useLayerCacheEffects({
  mode,
  layers,
  konvaLayersRef,
  updateLayerCache,
}) {
  useEffect(() => {
    // When mode changes, schedule updates for visible layers
    // Don't update all layers at once, stagger updates for better performance
    let delay = 0;

    layers.forEach((layer) => {
      if (!layer.visible) return; // Skip hidden layers

      const layerId = layer.id;
      const layerPair = konvaLayersRef.current[layerId];

      if (layerPair) {
        const resultLayer = layerPair.result;

        // Clear any scheduled updates
        if (resultLayer._cacheUpdateTimer) {
          cancelAnimationFrame(resultLayer._cacheUpdateTimer);
        }

        // Stagger updates by 50ms per layer
        setTimeout(() => {
          updateLayerCache(layerId);
        }, delay);

        delay += 50;
      }
    });
  }, [mode, updateLayerCache]);

  // When layers array changes (add/remove/reorder), update all caches
  useEffect(() => {
    // Use requestIdleCallback if available for non-critical updates
    const updateCaches = () => {
      layers.forEach((layer) => {
        updateLayerCache(layer.id);
      });
    };

    if (window.requestIdleCallback) {
      window.requestIdleCallback(updateCaches);
    } else {
      setTimeout(updateCaches, 100);
    }
  }, [layers.length, updateLayerCache]);
}

export function getLayerManagementFns({
  layers,
  setLayers,
  activeLayerId,
  setActiveLayerId,
  updateLayerCache,
}) {
  // Layer management functions remain unchanged
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

  const handleLayerOpacityChange = (id, newOpacity) => {
    // Update the layer state
    setLayers(
      layers.map((layer) =>
        layer.id === id ? { ...layer, opacity: newOpacity } : layer,
      ),
    );

    // We need to immediately update the cache to reflect the new opacity
    // This ensures that lines have their opacity updated right away
    setTimeout(() => {
      updateLayerCache(id);
    }, 0);
  };

  return {
    addLayer,
    deleteLayer,
    toggleLayerVisibility,
    reorderLayers,
    handleLayerOpacityChange,
  };
}
