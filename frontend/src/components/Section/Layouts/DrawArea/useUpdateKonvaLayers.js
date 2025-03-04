import Konva from "konva";
import { useCallback, useEffect } from "react";

export function useUpdateKonvaLayers({
  stageRef,
  layers,
  konvaLayersRef,
  layerLinesRef,
  updateLayerCache,
}) {
  // Update Konva layers when React layers state changes
  useEffect(() => {
    if (!stageRef.current) return;

    // Create new layers if needed
    layers.forEach((layer) => {
      if (!konvaLayersRef.current[layer.id]) {
        const newKonvaLayer = new Konva.Layer();
        stageRef.current.add(newKonvaLayer);
        konvaLayersRef.current[layer.id] = newKonvaLayer;
        layerLinesRef.current[layer.id] = [];
      }

      // Update visibility
      konvaLayersRef.current[layer.id].visible(layer.visible);
    });

    // Remove deleted layers
    Object.keys(konvaLayersRef.current).forEach((layerId) => {
      const numLayerId = parseInt(layerId, 10);
      if (!layers.some((l) => l.id === numLayerId)) {
        konvaLayersRef.current[layerId].destroy();
        delete konvaLayersRef.current[layerId];
        delete layerLinesRef.current[layerId];
      }
    });

    // Make sure the layers are in the correct order
    layers.forEach((layer, index) => {
      konvaLayersRef.current[layer.id].setZIndex(index);
      // Update layer cache after reordering
      updateLayerCache(layer.id);
    });
  }, [layers, updateLayerCache]);
}

export function useLayerCacheEffects({
  mode,
  layers,
  konvaLayersRef,
  updateLayerCache,
}) {
  useEffect(() => {
    // Update all layer caches when mode changes or layers are updated
    Object.keys(konvaLayersRef.current).forEach((layerId) => {
      updateLayerCache(parseInt(layerId, 10));
    });
  }, [mode, layers, updateLayerCache]);
}

export function useLayerCache({
  konvaLayersRef,
  layersRef,
  layerLinesRef,
  modeRef,
  stageRef,
}) {
  return useCallback((layerId) => {
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
          pixelRatio: window.devicePixelRatio || 2, // Using lower value for better performance
        });
      }
    }

    // Redraw the layer
    konvaLayer.batchDraw();
  }, []);
}

export function getLayerManagementFns({
  layers,
  setLayers,
  activeLayerId,
  setActiveLayerId,
}) {
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

  const handleLayerOpacityChange = (id, newOpacity) => {
    setLayers(
      layers.map((layer) =>
        layer.id === id ? { ...layer, opacity: newOpacity } : layer,
      ),
    );
  };

  return {
    addLayer,
    deleteLayer,
    toggleLayerVisibility,
    reorderLayers,
    handleLayerOpacityChange,
  };
}
