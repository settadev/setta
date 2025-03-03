import Konva from "konva";
import { useCallback, useEffect, useRef, useState } from "react";

export const DrawArea = () => {
  const containerRef = useRef(null);
  const [mode, setMode] = useState("brush");
  const stageRef = useRef(null);
  const layerRef = useRef(null);
  const isPaintRef = useRef(false);
  const lastLineRef = useRef(null);
  const modeRef = useRef(mode);

  // Update the ref whenever mode changes
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  // Define handlers with useCallback to maintain reference stability
  const handleMouseDown = useCallback((e) => {
    if (!stageRef.current || !layerRef.current) return;

    isPaintRef.current = true;
    const pos = stageRef.current.getPointerPosition();

    // Use modeRef.current instead of mode to get the latest value
    const currentMode = modeRef.current;

    lastLineRef.current = new Konva.Line({
      stroke: "#df4b26",
      strokeWidth: 5,
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

  return (
    <div className="nodrag single-cell-container section-row-main section-key-value relative max-h-full min-w-0">
      <div className="bg-gray-100 p-2">
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
      <div
        ref={containerRef}
        className="flex-grow bg-gray-50"
        style={{ touchAction: "none" }} // Prevents touch scrolling
      />
    </div>
  );
};
