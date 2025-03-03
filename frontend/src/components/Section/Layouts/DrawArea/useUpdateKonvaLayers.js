import Konva from "konva";
import { useEffect } from "react";

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
