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
