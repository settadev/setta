import Konva from "konva";
import { useCallback, useEffect, useRef, useState } from "react";

export const DrawArea = () => {
  const containerRef = useRef(null);
  const [mode, setMode] = useState("brush");
  const [opacity, setOpacity] = useState(1);
  const [brushSize, setBrushSize] = useState(5);
  const [eraserSize, setEraserSize] = useState(20);
  const [brushColor, setBrushColor] = useState("#df4b26"); // Default red color
  const [layers, setLayers] = useState([
    { id: 1, name: "Layer 1", visible: true, opacity: 1 },
  ]);
  const [activeLayerId, setActiveLayerId] = useState(1);

  const stageRef = useRef(null);
  const konvaLayersRef = useRef({});
  const isPaintRef = useRef(false);
  const lastLineRef = useRef(null);
  // Store all lines for each layer to manage opacity
  const layerLinesRef = useRef({});

  // Use refs to track current values during events
  const modeRef = useRef(mode);
  const opacityRef = useRef(opacity);
  const brushSizeRef = useRef(brushSize);
  const eraserSizeRef = useRef(eraserSize);
  const brushColorRef = useRef(brushColor);
  const activeLayerIdRef = useRef(activeLayerId);
  const layersRef = useRef(layers);

  // Update the refs whenever values change
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);
  useEffect(() => {
    opacityRef.current = opacity;
  }, [opacity]);
  useEffect(() => {
    brushSizeRef.current = brushSize;
  }, [brushSize]);
  useEffect(() => {
    eraserSizeRef.current = eraserSize;
  }, [eraserSize]);
  useEffect(() => {
    brushColorRef.current = brushColor;
  }, [brushColor]);
  useEffect(() => {
    activeLayerIdRef.current = activeLayerId;
  }, [activeLayerId]);
  useEffect(() => {
    layersRef.current = layers;
  }, [layers]);

  // Function to update layer's cache and opacity
  const updateLayerCache = useCallback((layerId) => {
    const konvaLayer = konvaLayersRef.current[layerId];
    if (!konvaLayer) return;

    const layerData = layersRef.current.find((l) => l.id === layerId);
    if (!layerData) return;

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
    // Only cache if there's actual content in the layer
    if (layerLines.length > 0) {
      // We need to calculate the bounding box of all shapes
      // or just use the stage dimensions for simplicity
      const stage = stageRef.current;
      if (stage) {
        konvaLayer.cache({
          x: 0,
          y: 0,
          width: stage.width(),
          height: stage.height(),
        });
      }
    }

    // Redraw the layer
    konvaLayer.batchDraw();
  }, []);

  // Update all layer caches when needed
  useEffect(() => {
    Object.keys(konvaLayersRef.current).forEach((layerId) => {
      updateLayerCache(parseInt(layerId, 10));
    });
  }, [layers, updateLayerCache]);

  // Define handlers with useCallback to maintain reference stability
  const handleMouseDown = useCallback((e) => {
    if (!stageRef.current || !konvaLayersRef.current[activeLayerIdRef.current])
      return;

    isPaintRef.current = true;
    const pos = stageRef.current.getPointerPosition();

    // Use refs to get the latest values
    const currentMode = modeRef.current;
    const currentOpacity = opacityRef.current;
    const currentBrushSize = brushSizeRef.current;
    const currentEraserSize = eraserSizeRef.current;
    const currentBrushColor = brushColorRef.current;
    const currentLayerId = activeLayerIdRef.current;

    // Choose size based on current mode
    const strokeWidth =
      currentMode === "brush" ? currentBrushSize : currentEraserSize;

    // Create the new line
    lastLineRef.current = new Konva.Line({
      stroke: currentBrushColor,
      strokeWidth: strokeWidth,
      // For brushes, use the brush opacity; for erasers, always full opacity
      opacity: currentMode === "brush" ? currentOpacity : 1,
      // Store original opacity for future adjustments
      _originalOpacity: currentOpacity,
      _isEraser: currentMode === "eraser",
      globalCompositeOperation:
        currentMode === "brush" ? "source-over" : "destination-out",
      lineCap: "round",
      lineJoin: "round",
      points: [pos.x, pos.y, pos.x, pos.y],
    });

    // Add line to the layer
    konvaLayersRef.current[currentLayerId].add(lastLineRef.current);

    // Store the line for opacity management
    if (!layerLinesRef.current[currentLayerId]) {
      layerLinesRef.current[currentLayerId] = [];
    }
    layerLinesRef.current[currentLayerId].push(lastLineRef.current);
  }, []);

  const handleMouseUp = useCallback(() => {
    isPaintRef.current = false;

    // When line drawing is complete, update the layer's cache
    if (lastLineRef.current) {
      const currentLayerId = activeLayerIdRef.current;

      // Clear the layer's cache before updating it
      if (konvaLayersRef.current[currentLayerId]) {
        konvaLayersRef.current[currentLayerId].clearCache();
      }

      // Update the cache with the new line included
      updateLayerCache(currentLayerId);
    }
  }, [updateLayerCache]);

  const handleMouseMove = useCallback((e) => {
    if (!isPaintRef.current || !lastLineRef.current || !stageRef.current)
      return;

    // Prevent scrolling on touch devices
    e.evt.preventDefault();

    const pos = stageRef.current.getPointerPosition();
    const newPoints = lastLineRef.current.points().concat([pos.x, pos.y]);
    lastLineRef.current.points(newPoints);

    // Update the layer with proper opacity handling
    const currentLayerId = activeLayerIdRef.current;
    const currentLayer = konvaLayersRef.current[currentLayerId];

    if (currentLayer) {
      // First, update the line points
      lastLineRef.current.points(newPoints);

      // Temporarily set the layer's opacity to 1 to avoid double-applying opacity
      const layerData = layersRef.current.find((l) => l.id === currentLayerId);
      const originalLayerOpacity = layerData ? layerData.opacity : 1;

      // Clear cache, set full opacity to avoid accumulation
      currentLayer.clearCache();
      currentLayer.opacity(1);

      // Update drawing
      currentLayer.batchDraw();

      // Immediately apply cache with the correct opacity to avoid flicker
      if (stageRef.current) {
        currentLayer.cache({
          x: 0,
          y: 0,
          width: stageRef.current.width(),
          height: stageRef.current.height(),
        });

        // Restore the layer opacity
        currentLayer.opacity(originalLayerOpacity);
        currentLayer.batchDraw();
      }
    }
  }, []);

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

  const handleToolChange = (e) => {
    setMode(e.target.value);
  };

  const handleOpacityChange = (e) => {
    const newOpacity = parseFloat(e.target.value);
    setOpacity(newOpacity);
  };

  const handleBrushSizeChange = (e) => {
    const newSize = parseInt(e.target.value, 10);
    setBrushSize(newSize);
  };

  const handleEraserSizeChange = (e) => {
    const newSize = parseInt(e.target.value, 10);
    setEraserSize(newSize);
  };

  const handleColorChange = (e) => {
    setBrushColor(e.target.value);
  };

  const handleLayerOpacityChange = (id, newOpacity) => {
    setLayers(
      layers.map((layer) =>
        layer.id === id ? { ...layer, opacity: newOpacity } : layer,
      ),
    );
  };

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

  const selectLayer = (id) => {
    setActiveLayerId(id);
  };

  return (
    <div className="nodrag single-cell-container section-row-main section-key-value relative flex max-h-full min-w-0 flex-col">
      <div className="flex flex-wrap gap-4 bg-gray-100 p-2">
        <div>
          <label className="mr-2">Tool:</label>
          <select
            value={mode}
            onChange={handleToolChange}
            className="rounded border border-gray-300 px-2 py-1"
          >
            <option value="brush">Brush</option>
            <option value="eraser">Eraser</option>
          </select>
        </div>

        <div className="flex items-center">
          <label className="mr-2">Color:</label>
          <input
            type="color"
            value={brushColor}
            onChange={handleColorChange}
            className={`h-8 w-10 cursor-pointer rounded ${mode !== "brush" ? "opacity-50" : ""}`}
            disabled={mode !== "brush"}
          />
        </div>

        <div className="flex items-center">
          <label className="mr-2">Opacity:</label>
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.1"
            value={opacity}
            onChange={handleOpacityChange}
            className={`w-32 ${mode !== "brush" ? "opacity-50" : ""}`}
            disabled={mode !== "brush"}
          />
          <span className="ml-2 w-8">{(opacity * 100).toFixed(0)}%</span>
        </div>

        <div className="flex items-center">
          <label className="mr-2">Brush Size:</label>
          <input
            type="range"
            min="1"
            max="50"
            value={brushSize}
            onChange={handleBrushSizeChange}
            className={`w-32 ${mode !== "brush" ? "opacity-50" : ""}`}
            disabled={mode !== "brush"}
          />
          <span className="ml-2 w-8">{brushSize}px</span>
        </div>

        <div className="flex items-center">
          <label className="mr-2">Eraser Size:</label>
          <input
            type="range"
            min="1"
            max="100"
            value={eraserSize}
            onChange={handleEraserSizeChange}
            className={`w-32 ${mode !== "eraser" ? "opacity-50" : ""}`}
            disabled={mode !== "eraser"}
          />
          <span className="ml-2 w-8">{eraserSize}px</span>
        </div>
      </div>

      <div className="flex h-full">
        {/* Layers panel */}
        <div className="flex w-48 flex-col bg-gray-200 p-2">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-bold">Layers</h3>
            <button
              onClick={addLayer}
              className="rounded bg-blue-500 px-2 py-1 text-sm text-white"
            >
              Add Layer
            </button>
          </div>

          <div className="flex-grow overflow-y-auto">
            {layers.map((layer) => (
              <div
                key={layer.id}
                className={`mb-1 flex cursor-pointer flex-col rounded p-2 ${
                  activeLayerId === layer.id
                    ? "border border-blue-300 bg-blue-100"
                    : "bg-white"
                }`}
                onClick={() => selectLayer(layer.id)}
              >
                <div className="flex items-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLayerVisibility(layer.id);
                    }}
                    className="mr-2 text-gray-600"
                  >
                    {layer.visible ? "👁️" : "👁️‍🗨️"}
                  </button>
                  <span className="flex-grow truncate">{layer.name}</span>
                  {layers.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteLayer(layer.id);
                      }}
                      className="ml-2 text-sm text-red-500"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Layer opacity control */}
                <div
                  className="mt-2 flex items-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  <label className="mr-2 text-xs text-gray-600">Opacity:</label>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.1"
                    value={layer.opacity}
                    onChange={(e) =>
                      handleLayerOpacityChange(
                        layer.id,
                        parseFloat(e.target.value),
                      )
                    }
                    className="w-24 flex-grow"
                  />
                  <span className="ml-1 w-8 text-xs">
                    {(layer.opacity * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Canvas */}
        <div
          ref={containerRef}
          className="flex-grow bg-gray-50"
          style={{ touchAction: "none" }} // Prevents touch scrolling
        />
      </div>
    </div>
  );
};
