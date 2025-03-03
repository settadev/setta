import Konva from "konva";
import { useCallback, useEffect, useRef, useState } from "react";
import { DrawAreaControls } from "./DrawAreaControls";

export const DrawArea = () => {
  const containerRef = useRef(null);
  const [mode, setMode] = useState("brush"); // Now can be "brush", "eraser", or "edit"
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
  // Reference for transformer
  const transformerRef = useRef(null);
  // Selected nodes reference
  const selectedNodesRef = useRef([]);

  // Selection rectangle related refs
  const selectionRectangleRef = useRef(null);
  const selectionStartRef = useRef({ x: 0, y: 0 });
  const isSelectingRef = useRef(false);

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

  // Function to update layer's cache and opacity
  const updateLayerCache = useCallback((layerId) => {
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
          pixelRatio: 1, // Using lower value for better performance
        });
      }
    }

    // Redraw the layer
    konvaLayer.batchDraw();
  }, []);

  useEffect(() => {
    // When entering edit mode, disable caching on all layers
    // When leaving edit mode, re-enable caching
    Object.keys(konvaLayersRef.current).forEach((layerId) => {
      updateLayerCache(parseInt(layerId, 10));
    });
  }, [mode, updateLayerCache]);

  // Update all layer caches when needed
  useEffect(() => {
    Object.keys(konvaLayersRef.current).forEach((layerId) => {
      updateLayerCache(parseInt(layerId, 10));
    });
  }, [layers, updateLayerCache]);

  // Define handlers with useCallback to maintain reference stability
  const handleMouseDown = useCallback((e) => {
    if (!stageRef.current) return;

    const currentMode = modeRef.current;
    const currentLayerId = activeLayerIdRef.current;
    const currentLayer = konvaLayersRef.current[currentLayerId];

    if (!currentLayer) return;

    // Get pointer position
    const pos = stageRef.current.getPointerPosition();

    // Handle based on mode
    if (currentMode === "edit") {
      // If clicking on stage (not on a shape)
      if (e.target === stageRef.current) {
        // Start selection rectangle
        isSelectingRef.current = true;
        selectionStartRef.current = { x: pos.x, y: pos.y };

        if (selectionRectangleRef.current) {
          selectionRectangleRef.current.setAttrs({
            x: pos.x,
            y: pos.y,
            width: 0,
            height: 0,
            visible: true,
          });

          // Clear current selection if not holding shift
          if (!e.evt.shiftKey && transformerRef.current) {
            transformerRef.current.nodes([]);
            selectedNodesRef.current = [];
            currentLayer.batchDraw(); // Important: Redraw the layer to update view
          }
        }
      } else if (
        e.target.className === "Line" ||
        e.target.name() === "drawingLine"
      ) {
        // If clicking on a line - now check both className and name
        const clickedLine = e.target;
        const isAlreadySelected =
          selectedNodesRef.current.includes(clickedLine);

        // Handle selection logic
        if (e.evt.shiftKey) {
          // Toggle selection with shift key
          if (isAlreadySelected) {
            // Remove from selection
            selectedNodesRef.current = selectedNodesRef.current.filter(
              (node) => node !== clickedLine,
            );
          } else {
            // Add to selection
            selectedNodesRef.current.push(clickedLine);
          }
        } else if (!isAlreadySelected) {
          // Select only this line if not already selected and not holding shift
          selectedNodesRef.current = [clickedLine];
        } else {
          // Clicking on already selected item - still need to attach transformer
          // This ensures handles appear right away
        }

        selectedNodesRef.current.forEach(prepareLineForTransform);

        // Update transformer - important: we need to do this regardless
        if (transformerRef.current) {
          transformerRef.current.nodes(selectedNodesRef.current);
          transformerRef.current.moveToTop(); // Make sure transformer is on top
          currentLayer.batchDraw(); // Ensure the layer is redrawn
        }
      }
    } else {
      // Original drawing behavior for brush/eraser modes
      isPaintRef.current = true;

      const currentOpacity = opacityRef.current;
      const currentBrushSize = brushSizeRef.current;
      const currentEraserSize = eraserSizeRef.current;
      const currentBrushColor = brushColorRef.current;

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
        draggable: currentMode === "edit", // Make lines draggable only in edit mode
        name: "drawingLine", // Add name for easier selection
        // Add these transform properties to make lines work better with transformer
        transformsEnabled: "all",
        listening: true,
      });

      // Add line to the layer
      currentLayer.add(lastLineRef.current);

      // Store the line for opacity management
      if (!layerLinesRef.current[currentLayerId]) {
        layerLinesRef.current[currentLayerId] = [];
      }
      layerLinesRef.current[currentLayerId].push(lastLineRef.current);
    }
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!stageRef.current) return;

    const currentMode = modeRef.current;
    const currentLayerId = activeLayerIdRef.current;
    const currentLayer = konvaLayersRef.current[currentLayerId];

    if (!currentLayer) return;

    // Get pointer position
    const pos = stageRef.current.getPointerPosition();

    // Handle based on mode
    if (currentMode === "edit" && isSelectingRef.current) {
      // Update selection rectangle
      e.evt.preventDefault();

      if (selectionRectangleRef.current) {
        const width = pos.x - selectionStartRef.current.x;
        const height = pos.y - selectionStartRef.current.y;

        selectionRectangleRef.current.setAttrs({
          x: width < 0 ? pos.x : selectionStartRef.current.x,
          y: height < 0 ? pos.y : selectionStartRef.current.y,
          width: Math.abs(width),
          height: Math.abs(height),
        });

        currentLayer.batchDraw();
      }
    } else if (isPaintRef.current && lastLineRef.current) {
      // Original drawing behavior
      e.evt.preventDefault();

      const newPoints = lastLineRef.current.points().concat([pos.x, pos.y]);
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

  const handleMouseUp = useCallback(
    (e) => {
      const currentMode = modeRef.current;
      const currentLayerId = activeLayerIdRef.current;
      const currentLayer = konvaLayersRef.current[currentLayerId];

      if (!currentLayer) return;

      if (currentMode === "edit" && isSelectingRef.current) {
        // Finish selection rectangle and select contained lines
        isSelectingRef.current = false;

        if (
          selectionRectangleRef.current &&
          selectionRectangleRef.current.visible()
        ) {
          const selectionBox = selectionRectangleRef.current.getClientRect();

          // Find all lines in the current layer
          const lines = currentLayer.find(".drawingLine");

          // Filter to get lines that intersect with selection rectangle
          const selectedLines = lines.filter((line) =>
            Konva.Util.haveIntersection(selectionBox, line.getClientRect()),
          );

          // If shift is held, add to existing selection, otherwise replace
          if (e.evt.shiftKey) {
            // Add only lines that aren't already selected
            selectedLines.forEach((line) => {
              if (!selectedNodesRef.current.includes(line)) {
                selectedNodesRef.current.push(line);
              }
            });
          } else {
            selectedNodesRef.current = selectedLines;
          }

          // Prepare all selected lines for transformation
          selectedNodesRef.current.forEach(prepareLineForTransform);

          // Then update the transformer
          if (transformerRef.current) {
            transformerRef.current.nodes(selectedNodesRef.current);
            transformerRef.current.moveToTop();
          }

          // Hide selection rectangle
          selectionRectangleRef.current.visible(false);

          // Redraw the layer
          currentLayer.batchDraw();
        }
      } else if (isPaintRef.current) {
        // Original behavior for completing a brush stroke
        isPaintRef.current = false;

        // When line drawing is complete, update the layer's cache
        if (lastLineRef.current) {
          // Clear the layer's cache before updating it
          currentLayer.clearCache();

          // Update the cache with the new line included
          updateLayerCache(currentLayerId);
        }
      }
    },
    [updateLayerCache],
  );

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

  // Effect to handle mode changes and control transformer visibility
  useEffect(() => {
    // When switching from edit mode, clear selections
    if (mode !== "edit") {
      if (transformerRef.current) {
        transformerRef.current.nodes([]);
        selectedNodesRef.current = [];
      }
    }

    // Make all lines draggable in edit mode, non-draggable otherwise
    Object.keys(konvaLayersRef.current).forEach((layerId) => {
      const layer = konvaLayersRef.current[layerId];
      const lines = layer.find(".drawingLine");

      lines.forEach((line) => {
        line.draggable(mode === "edit");
      });

      layer.batchDraw();
    });
  }, [mode]);

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

  // Control handlers
  const handleToolChange = (value) => {
    setMode(value);
  };

  const handleOpacityChange = (value) => {
    setOpacity(value);
  };

  const handleBrushSizeChange = (value) => {
    setBrushSize(value);
  };

  const handleEraserSizeChange = (value) => {
    setEraserSize(value);
  };

  const handleColorChange = (value) => {
    setBrushColor(value);
  };

  const handleLayerOpacityChange = (id, newOpacity) => {
    setLayers(
      layers.map((layer) =>
        layer.id === id ? { ...layer, opacity: newOpacity } : layer,
      ),
    );
  };

  // Function to delete selected objects
  const deleteSelectedObjects = () => {
    if (selectedNodesRef.current.length === 0) return;

    const currentLayerId = activeLayerIdRef.current;

    // Remove selected nodes from the layer
    selectedNodesRef.current.forEach((node) => {
      // Also remove them from layerLinesRef
      if (layerLinesRef.current[currentLayerId]) {
        const nodeIndex = layerLinesRef.current[currentLayerId].findIndex(
          (line) => line === node,
        );
        if (nodeIndex >= 0) {
          layerLinesRef.current[currentLayerId].splice(nodeIndex, 1);
        }
      }

      node.destroy();
    });

    // Clear selection
    selectedNodesRef.current = [];
    if (transformerRef.current) {
      transformerRef.current.nodes([]);
    }

    // Redraw the layer
    if (konvaLayersRef.current[currentLayerId]) {
      konvaLayersRef.current[currentLayerId].batchDraw();
      updateLayerCache(currentLayerId);
    }
  };

  const clearStrokes = () => {
    const currentLayerId = activeLayerId;
    const konvaLayer = konvaLayersRef.current[currentLayerId];

    if (!konvaLayer) return;

    // Remove all line shapes from the Konva layer
    konvaLayer.destroyChildren();

    // Clear the stored references to lines for this layer
    layerLinesRef.current[currentLayerId] = [];

    // Clear the layer's cache
    konvaLayer.clearCache();

    // Recreate transformer if in edit mode
    if (mode === "edit") {
      const transformer = new Konva.Transformer({
        borderStroke: "#2196F3",
        borderStrokeWidth: 1,
        anchorStroke: "#2196F3",
        anchorFill: "#FFFFFF",
        anchorSize: 8,
        rotateAnchorOffset: 30,
        enabledAnchors: [
          "top-left",
          "top-right",
          "bottom-left",
          "bottom-right",
        ],
      });

      konvaLayer.add(transformer);
      transformerRef.current = transformer;

      // Create selection rectangle
      const selectionRect = new Konva.Rect({
        fill: "rgba(0, 123, 255, 0.3)",
        stroke: "#2196F3",
        strokeWidth: 1,
        visible: false,
        listening: false,
      });

      konvaLayer.add(selectionRect);
      selectionRectangleRef.current = selectionRect;
    }

    // Redraw the layer
    konvaLayer.batchDraw();

    // Make sure the current line reference is cleared if it was on this layer
    if (lastLineRef.current && lastLineRef.current.parent === konvaLayer) {
      lastLineRef.current = null;
    }

    // Clear selection
    selectedNodesRef.current = [];
  };

  // Add this function to your component to prepare lines for transformation
  const prepareLineForTransform = (line) => {
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

  return (
    <>
      {/* Pass all control-related props to the DrawControls component */}
      <DrawAreaControls
        mode={mode}
        opacity={opacity}
        brushSize={brushSize}
        eraserSize={eraserSize}
        brushColor={brushColor}
        layers={layers}
        activeLayerId={activeLayerId}
        onToolChange={handleToolChange}
        onOpacityChange={handleOpacityChange}
        onBrushSizeChange={handleBrushSizeChange}
        onEraserSizeChange={handleEraserSizeChange}
        onColorChange={handleColorChange}
        onLayerOpacityChange={handleLayerOpacityChange}
        onAddLayer={addLayer}
        onDeleteLayer={deleteLayer}
        onToggleLayerVisibility={toggleLayerVisibility}
        onSelectLayer={setActiveLayerId}
        onReorderLayers={reorderLayers}
        clearStrokes={clearStrokes}
        onDeleteSelected={deleteSelectedObjects} // New prop for edit mode
      />
      <section className="nodrag single-cell-container section-row-main section-key-value relative max-h-full min-w-0">
        <div className="single-cell-child single-cell-container">
          <div
            ref={containerRef}
            className="single-cell-child max-w-full place-self-center"
            style={{ touchAction: mode === "edit" ? "auto" : "none" }}
          />
        </div>
      </section>
    </>
  );
};
