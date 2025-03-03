import Konva from "konva";
import { useCallback, useEffect, useRef, useState } from "react";

export const DrawArea = () => {
  const containerRef = useRef(null);
  const [mode, setMode] = useState("brush");
  const [opacity, setOpacity] = useState(1);
  const [brushSize, setBrushSize] = useState(5);
  const [eraserSize, setEraserSize] = useState(20);
  const [brushColor, setBrushColor] = useState("#df4b26"); // Default red color
  const stageRef = useRef(null);
  const layerRef = useRef(null);
  const isPaintRef = useRef(false);
  const lastLineRef = useRef(null);

  const modeRef = useRef(mode);
  const opacityRef = useRef(opacity);
  const brushSizeRef = useRef(brushSize);
  const eraserSizeRef = useRef(eraserSize);
  const brushColorRef = useRef(brushColor);

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

  // Define handlers with useCallback to maintain reference stability
  const handleMouseDown = useCallback((e) => {
    if (!stageRef.current || !layerRef.current) return;

    isPaintRef.current = true;
    const pos = stageRef.current.getPointerPosition();

    // Use refs to get the latest values
    const currentMode = modeRef.current;
    const currentOpacity = opacityRef.current;
    const currentBrushSize = brushSizeRef.current;
    const currentEraserSize = eraserSizeRef.current;
    const currentBrushColor = brushColorRef.current;

    // Choose size based on current mode
    const strokeWidth =
      currentMode === "brush" ? currentBrushSize : currentEraserSize;

    lastLineRef.current = new Konva.Line({
      stroke: currentBrushColor, // Use the selected color
      strokeWidth: strokeWidth,
      opacity: currentMode === "brush" ? currentOpacity : 1,
      globalCompositeOperation:
        currentMode === "brush" ? "source-over" : "destination-out",
      lineCap: "round",
      lineJoin: "round",
      points: [pos.x, pos.y, pos.x, pos.y],
    });

    layerRef.current.add(lastLineRef.current);
  }, []);

  const handleMouseUp = useCallback(() => {
    isPaintRef.current = false;
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isPaintRef.current || !lastLineRef.current || !stageRef.current)
      return;

    // Prevent scrolling on touch devices
    e.evt.preventDefault();

    const pos = stageRef.current.getPointerPosition();
    const newPoints = lastLineRef.current.points().concat([pos.x, pos.y]);
    lastLineRef.current.points(newPoints);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize Konva stage and layer
    const stage = new Konva.Stage({
      container: containerRef.current,
      width: 500,
      height: 500,
    });

    const layer = new Konva.Layer();
    stage.add(layer);

    // Store references
    stageRef.current = stage;
    layerRef.current = layer;

    // Add event listeners
    stage.on("mousedown touchstart", handleMouseDown);
    stage.on("mouseup touchend", handleMouseUp);
    stage.on("mousemove touchmove", handleMouseMove);

    // Handle window resize
    const resizeObserver = new ResizeObserver(() => {
      if (containerRef.current) {
        stage.width(containerRef.current.offsetWidth);
        stage.height(containerRef.current.offsetHeight);
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
  }, [handleMouseDown, handleMouseUp, handleMouseMove]);

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

  return (
    <div className="nodrag single-cell-container section-row-main section-key-value relative max-h-full min-w-0">
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
      <div
        ref={containerRef}
        className="flex-grow bg-gray-50"
        style={{ touchAction: "none" }} // Prevents touch scrolling
      />
    </div>
  );
};
