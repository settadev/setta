import Konva from "konva";
import { useEffect, useRef, useState } from "react";

// Utility function to generate unique IDs
const generateId = () => `id-${Math.random().toString(36).substr(2, 9)}`;

// Custom hook for managing canvas layers
const useKonvaLayers = () => {
  const [layers, setLayers] = useState([
    { id: generateId(), name: "Layer 1", opacity: 1, visible: true },
  ]);
  const layerRefs = useRef({});

  // Create a new layer
  const addLayer = () => {
    const newLayer = {
      id: generateId(),
      name: `Layer ${layers.length + 1}`,
      opacity: 1,
      visible: true,
    };
    setLayers([...layers, newLayer]);
  };

  // Remove a layer by id
  const removeLayer = (id) => {
    setLayers(layers.filter((layer) => layer.id !== id));
  };

  // Update layer properties
  const updateLayer = (id, updates) => {
    setLayers(
      layers.map((layer) =>
        layer.id === id ? { ...layer, ...updates } : layer,
      ),
    );
  };

  // Get layer reference
  const getLayerRef = (id) => layerRefs.current[id];

  // Register layer reference
  const registerLayerRef = (id, ref) => {
    layerRefs.current[id] = ref;
  };

  return {
    layers,
    addLayer,
    removeLayer,
    updateLayer,
    getLayerRef,
    registerLayerRef,
  };
};

// Custom hook for managing drawing tools
const useDrawingTools = () => {
  const [tool, setTool] = useState("brush"); // brush, eraser, select
  const [brushSize, setBrushSize] = useState(5);
  const [brushColor, setBrushColor] = useState("#000000");
  const [brushOpacity, setBrushOpacity] = useState(1);

  return {
    tool,
    setTool,
    brushSize,
    setBrushSize,
    brushColor,
    setBrushColor,
    brushOpacity,
    setBrushOpacity,
  };
};

export const DrawArea = () => {
  // Refs
  const stageRef = useRef(null);
  const containerRef = useRef(null);
  const isDrawing = useRef(false);
  const currentLine = useRef(null);
  const selectedShapeRef = useRef(null);
  const transformerRef = useRef(null);

  // State
  const [currentLayerId, setCurrentLayerId] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [mode, setMode] = useState("draw"); // draw, edit

  // Custom hooks
  const {
    layers,
    addLayer,
    removeLayer,
    updateLayer,
    getLayerRef,
    registerLayerRef,
  } = useKonvaLayers();

  const {
    tool,
    setTool,
    brushSize,
    setBrushSize,
    brushColor,
    setBrushColor,
    brushOpacity,
    setBrushOpacity,
  } = useDrawingTools();

  // Initialize stage and first layer on mount
  useEffect(() => {
    if (!containerRef.current) return;

    // Create Konva stage
    const stage = new Konva.Stage({
      container: containerRef.current,
      width: 500,
      height: 500,
    });

    stageRef.current = stage;

    // Create initial layer
    const firstLayer = new Konva.Layer();
    stage.add(firstLayer);
    registerLayerRef(layers[0].id, firstLayer);
    setCurrentLayerId(layers[0].id);

    // Apply event handlers
    setupEventHandlers(stage);

    // Cleanup on unmount
    return () => {
      stage.destroy();
    };
  }, []);

  // Update layer opacity when it changes in state
  useEffect(() => {
    layers.forEach((layer) => {
      const layerRef = getLayerRef(layer.id);
      if (layerRef) {
        layerRef.opacity(layer.opacity);
        layerRef.visible(layer.visible);
        layerRef.batchDraw();
      }
    });
  }, [layers]);

  // Setup event handlers for the Konva stage
  const setupEventHandlers = (stage) => {
    stage.on("mousedown touchstart", handleMouseDown);
    stage.on("mousemove touchmove", handleMouseMove);
    stage.on("mouseup touchend", handleMouseUp);
    stage.on("click tap", handleClick);
  };

  // Save current state to history
  const saveToHistory = () => {
    // Serialize stage data for history
    const stageData = stageRef.current.toJSON();

    // If we've gone back in history and now are creating a new branch
    if (historyIndex < history.length - 1) {
      setHistory(history.slice(0, historyIndex + 1).concat(stageData));
    } else {
      setHistory([...history, stageData]);
    }

    setHistoryIndex(Math.min(history.length, historyIndex + 1));
  };

  // Undo last action
  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const previousState = history[newIndex];

      // Load previous state
      stageRef.current.destroy();
      const stage = Konva.Node.create(previousState, containerRef.current);
      stageRef.current = stage;

      setupEventHandlers(stage);
      setHistoryIndex(newIndex);

      // Relink layer refs
      layers.forEach((layer) => {
        const layerNode = stage.findOne(`#${layer.id}`);
        if (layerNode) {
          registerLayerRef(layer.id, layerNode);
        }
      });
    }
  };

  // Redo previously undone action
  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const nextState = history[newIndex];

      // Load next state
      stageRef.current.destroy();
      const stage = Konva.Node.create(nextState, containerRef.current);
      stageRef.current = stage;

      setupEventHandlers(stage);
      setHistoryIndex(newIndex);

      // Relink layer refs
      layers.forEach((layer) => {
        const layerNode = stage.findOne(`#${layer.id}`);
        if (layerNode) {
          registerLayerRef(layer.id, layerNode);
        }
      });
    }
  };

  // Handle mouse down (start drawing or selecting)
  const handleMouseDown = (e) => {
    if (!currentLayerId) return;
    const stage = stageRef.current;
    const currentLayer = getLayerRef(currentLayerId);

    if (!currentLayer) return;

    // Prevent default behavior to stop text selection
    e.evt.preventDefault();

    const pos = stage.getPointerPosition();

    if (mode === "draw") {
      isDrawing.current = true;

      if (tool === "brush" || tool === "eraser") {
        // Create a new line
        const newLine = new Konva.Line({
          points: [pos.x, pos.y],
          stroke: tool === "brush" ? brushColor : "#ffffff",
          strokeWidth: brushSize,
          globalCompositeOperation:
            tool === "eraser" ? "destination-out" : "source-over",
          opacity: brushOpacity,
          lineCap: "round",
          lineJoin: "round",
          id: generateId(),
          name: tool === "brush" ? "brush-stroke" : "eraser-stroke",
        });

        currentLayer.add(newLine);
        currentLine.current = newLine;
      }
    } else if (mode === "edit") {
      // Deselect previous selection
      if (selectedShapeRef.current) {
        selectedShapeRef.current = null;
        transformerRef.current?.detach();
        transformerRef.current?.getLayer()?.batchDraw();
      }

      // Find clicked shape
      const shape = e.target;

      // If we clicked on an empty space, do nothing
      if (shape === stage || shape === currentLayer) {
        return;
      }

      // Select the shape
      selectedShapeRef.current = shape;

      // Create transformer if it doesn't exist
      if (!transformerRef.current) {
        const tr = new Konva.Transformer({
          nodes: [shape],
          anchorStroke: "#0000ff",
          anchorFill: "#ffffff",
          anchorSize: 8,
          borderStroke: "#0000ff",
          borderDash: [3, 3],
        });
        currentLayer.add(tr);
        transformerRef.current = tr;
      } else {
        transformerRef.current.nodes([shape]);
      }

      currentLayer.batchDraw();
    }
  };

  // Handle mouse move (continue drawing)
  const handleMouseMove = (e) => {
    if (!isDrawing.current || !currentLine.current || mode !== "draw") return;

    const stage = stageRef.current;
    const pos = stage.getPointerPosition();

    // Add point to line
    const newPoints = currentLine.current.points().concat([pos.x, pos.y]);
    currentLine.current.points(newPoints);

    getLayerRef(currentLayerId)?.batchDraw();
  };

  // Handle mouse up (finish drawing or moving)
  const handleMouseUp = () => {
    if (isDrawing.current && mode === "draw") {
      isDrawing.current = false;
      saveToHistory();
    } else if (mode === "edit" && selectedShapeRef.current) {
      // Save the state after a transform/move operation
      saveToHistory();
    }
  };

  // Handle click (for selecting in edit mode)
  const handleClick = (e) => {
    if (mode !== "edit") return;

    const stage = stageRef.current;
    const clickedOnStage =
      e.target === stage || e.target === getLayerRef(currentLayerId);

    if (clickedOnStage) {
      // Deselect when clicking on empty area
      selectedShapeRef.current = null;
      transformerRef.current?.detach();
      transformerRef.current?.getLayer()?.batchDraw();
    }
  };

  // Add image to the current layer
  const addImage = (imageUrl) => {
    const currentLayer = getLayerRef(currentLayerId);
    if (!currentLayer) return;

    const img = new Image();
    img.onload = () => {
      const konvaImage = new Konva.Image({
        x: 100,
        y: 100,
        image: img,
        width: Math.min(200, img.width),
        height: Math.min(200, img.height),
        draggable: mode === "edit",
        id: generateId(),
        name: "image",
      });

      currentLayer.add(konvaImage);
      currentLayer.batchDraw();
      saveToHistory();
    };
    img.src = imageUrl;
  };

  // Clear current layer
  const clearLayer = () => {
    const currentLayer = getLayerRef(currentLayerId);
    if (!currentLayer) return;

    currentLayer.destroyChildren();
    currentLayer.batchDraw();
    saveToHistory();
  };

  // Toggle mode between draw and edit
  const toggleMode = () => {
    const newMode = mode === "draw" ? "edit" : "draw";
    setMode(newMode);

    // Update shape draggability based on mode
    if (stageRef.current) {
      const shapes = stageRef.current.find("Image, Line");
      shapes.forEach((shape) => {
        shape.draggable(newMode === "edit");
      });

      // Clear selection when switching to draw mode
      if (newMode === "draw") {
        selectedShapeRef.current = null;
        transformerRef.current?.detach();
        transformerRef.current?.getLayer()?.batchDraw();
      }
    }
  };

  return (
    <div className="nodrag mx-auto flex w-full max-w-4xl flex-col gap-3">
      <div className="flex gap-4 rounded bg-gray-100 p-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTool("brush")}
            className={`rounded px-2 py-1 ${tool === "brush" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
          >
            Brush
          </button>
          <button
            onClick={() => setTool("eraser")}
            className={`rounded px-2 py-1 ${tool === "eraser" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
          >
            Eraser
          </button>
          <button
            onClick={toggleMode}
            className={`rounded px-2 py-1 ${mode === "edit" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
          >
            {mode === "draw" ? "Edit Mode" : "Draw Mode"}
          </button>
        </div>

        <div className="flex flex-grow flex-wrap items-center gap-3">
          <label className="flex items-center gap-1 text-sm">
            Size:
            <input
              type="range"
              min="1"
              max="50"
              value={brushSize}
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
              className="w-24"
            />
            <span>{brushSize}px</span>
          </label>

          <label className="flex items-center gap-1 text-sm">
            Color:
            <input
              type="color"
              value={brushColor}
              onChange={(e) => setBrushColor(e.target.value)}
              className="h-8 w-8"
            />
          </label>

          <label className="flex items-center gap-1 text-sm">
            Opacity:
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.1"
              value={brushOpacity}
              onChange={(e) => setBrushOpacity(parseFloat(e.target.value))}
              className="w-24"
            />
            <span>{(brushOpacity * 100).toFixed(0)}%</span>
          </label>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={undo}
            disabled={historyIndex <= 0}
            className={`rounded px-2 py-1 ${historyIndex <= 0 ? "cursor-not-allowed bg-gray-100 text-gray-400" : "bg-gray-200"}`}
          >
            Undo
          </button>
          <button
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            className={`rounded px-2 py-1 ${historyIndex >= history.length - 1 ? "cursor-not-allowed bg-gray-100 text-gray-400" : "bg-gray-200"}`}
          >
            Redo
          </button>
          <button
            onClick={clearLayer}
            className="rounded bg-gray-200 px-2 py-1"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="flex gap-4">
        <div
          ref={containerRef}
          className="h-[500px] w-[500px] border border-gray-300"
        ></div>

        <div className="max-w-xs flex-grow border border-gray-300 p-3">
          <h3 className="mb-2 text-lg font-medium">Layers</h3>
          <ul className="mb-3 space-y-2">
            {layers.map((layer) => (
              <li
                key={layer.id}
                className={`cursor-pointer rounded p-2 ${currentLayerId === layer.id ? "bg-blue-50" : "bg-gray-50"}`}
                onClick={() => setCurrentLayerId(layer.id)}
              >
                <div className="mb-1 text-sm font-medium">{layer.name}</div>
                <div className="flex flex-col gap-1">
                  <label className="flex items-center gap-1 text-xs">
                    Visible:
                    <input
                      type="checkbox"
                      checked={layer.visible}
                      onChange={(e) =>
                        updateLayer(layer.id, { visible: e.target.checked })
                      }
                      className="form-checkbox"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </label>
                  <label className="flex items-center gap-1 text-xs">
                    Opacity:
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.1"
                      value={layer.opacity}
                      onChange={(e) =>
                        updateLayer(layer.id, {
                          opacity: parseFloat(e.target.value),
                        })
                      }
                      className="w-20"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span>{(layer.opacity * 100).toFixed(0)}%</span>
                  </label>
                  <button
                    className={`mt-1 rounded px-1 py-0.5 text-xs ${layers.length <= 1 ? "cursor-not-allowed bg-gray-100 text-gray-400" : "bg-red-100 text-red-600"}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (layers.length > 1) {
                        if (currentLayerId === layer.id) {
                          // Switch to another layer before removing
                          const otherLayer = layers.find(
                            (l) => l.id !== layer.id,
                          );
                          if (otherLayer) setCurrentLayerId(otherLayer.id);
                        }
                        const layerRef = getLayerRef(layer.id);
                        layerRef?.destroy();
                        removeLayer(layer.id);
                        saveToHistory();
                      }
                    }}
                    disabled={layers.length <= 1}
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <button
            className="w-full rounded bg-blue-100 px-2 py-1 text-sm text-blue-600"
            onClick={() => {
              const newLayerId = generateId();
              addLayer();

              // Create new Konva layer
              const newLayer = new Konva.Layer({
                id: newLayerId,
              });
              stageRef.current.add(newLayer);
              registerLayerRef(newLayerId, newLayer);
              setCurrentLayerId(newLayerId);
            }}
          >
            Add Layer
          </button>
        </div>
      </div>

      <div className="mt-2">
        <button
          className="rounded bg-gray-200 px-3 py-1"
          onClick={() => {
            // For demo purposes we'll use a placeholder
            const demoImageUrl = "/api/placeholder/200/200";
            addImage(demoImageUrl);
          }}
        >
          Add Demo Image
        </button>
      </div>
    </div>
  );
};

// Component is exported at declaration
