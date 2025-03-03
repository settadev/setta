import { useEffect, useRef, useState } from "react";
import { Group, Image, Layer, Line, Stage } from "react-konva";
import { useSectionInfos } from "state/definitions";
import { setDrawAreaSectionSize } from "state/hooks/sectionSizes";
import { KonvaDrawAreaControls } from "./KonvaDrawAreaControls";

export function DrawArea({ sectionId }) {
  const stageRef = useRef(null);

  // Local state for drawing settings
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(5);
  const [eraserBrushSize, setEraserBrushSize] = useState(20);
  const [isEraser, setIsEraser] = useState(false);
  const [brushOpacity, setBrushOpacity] = useState(1.0);
  const [mode, setMode] = useState("draw"); // "draw" or "select"

  // Local state for layers
  const [layers, setLayers] = useState([]);
  const [activeLayerId, setActiveLayerId] = useState(null);
  const [activeLayer, setActiveLayer] = useState({
    id: "default-layer",
    layerOpacity: 1.0,
    brushOpacity: 1.0,
  });

  const isDrawing = useRef(false);

  // For size calculations
  const { width, height } = { width: 800, height: 600 }; // Default size

  // Initialize default layer if no layers exist
  useEffect(() => {
    if (layers.length === 0) {
      // Create a default drawing layer
      const defaultLayer = {
        id: activeLayer.id,
        type: "drawing",
        lines: [],
        opacity: activeLayer.layerOpacity ?? 1.0,
      };

      setLayers([defaultLayer]);
      setActiveLayerId(defaultLayer.id);
    }
  }, []);

  // Update active layer opacity when activeLayerId changes
  useEffect(() => {
    if (activeLayerId) {
      const selectedLayer = layers.find((layer) => layer.id === activeLayerId);
      if (selectedLayer) {
        setActiveLayer((prev) => ({
          ...prev,
          id: activeLayerId,
          layerOpacity: selectedLayer.opacity,
        }));
      }
    }
  }, [activeLayerId, layers]);

  // Handle drawing mode
  useEffect(() => {
    if (!stageRef.current) return;

    const stage = stageRef.current;
    if (mode === "draw") {
      stage.container().style.cursor = "crosshair";
    } else {
      stage.container().style.cursor = "default";
    }
  }, [mode]);

  // Set initial default sizes to avoid "auto" errors with Konva
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });

  useEffect(() => {
    useSectionInfos.setState((state) => {
      const canvasSize = setDrawAreaSectionSize({
        sectionId,
        sectionHeight: height,
        sectionWidth: width,
        state,
      });

      if (
        typeof canvasSize.width === "number" &&
        typeof canvasSize.height === "number"
      ) {
        setStageSize({
          width: canvasSize.width,
          height: canvasSize.height,
        });
      }

      return state;
    });
  }, [width, height, sectionId]);

  const handleMouseDown = (e) => {
    if (mode !== "draw" || !activeLayerId) return;

    isDrawing.current = true;
    const pos = e.target.getStage().getPointerPosition();

    const activeLayerIndex = layers.findIndex(
      (layer) => layer.id === activeLayerId,
    );
    if (activeLayerIndex === -1 || layers[activeLayerIndex].type !== "drawing")
      return;

    // Add new line to the active layer
    const newLine = {
      points: [pos.x, pos.y],
      color: isEraser ? "#FFFFFF" : color,
      strokeWidth: isEraser ? eraserBrushSize : brushSize,
      opacity: activeLayer.brushOpacity ?? 1,
      globalCompositeOperation: isEraser ? "destination-out" : "source-over",
      isEraser: isEraser,
    };

    setLayers((prevLayers) => {
      const updatedLayers = [...prevLayers];
      updatedLayers[activeLayerIndex] = {
        ...updatedLayers[activeLayerIndex],
        lines: [...updatedLayers[activeLayerIndex].lines, newLine],
      };
      return updatedLayers;
    });
  };

  const handleMouseMove = (e) => {
    if (!isDrawing.current || mode !== "draw" || !activeLayerId) return;

    const activeLayerIndex = layers.findIndex(
      (layer) => layer.id === activeLayerId,
    );
    if (activeLayerIndex === -1 || layers[activeLayerIndex].type !== "drawing")
      return;

    const stage = e.target.getStage();
    const point = stage.getPointerPosition();

    setLayers((prevLayers) => {
      const updatedLayers = [...prevLayers];
      const layerLines = [...updatedLayers[activeLayerIndex].lines];
      const lastLineIndex = layerLines.length - 1;

      // Update the last line's points
      layerLines[lastLineIndex] = {
        ...layerLines[lastLineIndex],
        points: [...layerLines[lastLineIndex].points, point.x, point.y],
      };

      updatedLayers[activeLayerIndex] = {
        ...updatedLayers[activeLayerIndex],
        lines: layerLines,
      };

      return updatedLayers;
    });
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
  };

  // This function loads an image into a layer
  const loadImageToLayer = (layerId, imageUrl) => {
    // Create an image object
    const imageObj = new window.Image();
    imageObj.src = imageUrl;
    imageObj.onload = () => {
      setLayers((prevLayers) =>
        prevLayers.map((layer) =>
          layer.id === layerId ? { ...layer, imageObj: imageObj } : layer,
        ),
      );
    };
  };

  // Add a new layer
  const addLayer = (layerType = "drawing", opacity = 1.0) => {
    const newLayerId = `layer-${Date.now()}`;
    const newLayer = {
      id: newLayerId,
      type: layerType,
      lines: [],
      opacity: opacity,
      imageObj: null,
    };

    setLayers((prevLayers) => [...prevLayers, newLayer]);

    // Set this as the active layer
    setActiveLayerId(newLayerId);
    setActiveLayer((prev) => ({
      ...prev,
      id: newLayerId,
      layerOpacity: opacity,
    }));

    return newLayerId;
  };

  // Handle layer opacity change
  const handleLayerOpacityChange = (layerId, opacity) => {
    console.log(`Changing opacity of layer ${layerId} to ${opacity}`);

    // Update the specific layer's opacity in the layers array
    setLayers((prevLayers) => {
      return prevLayers.map((layer) => {
        if (layer.id === layerId) {
          console.log(
            `Found layer ${layerId}, updating opacity from ${layer.opacity} to ${opacity}`,
          );
          return { ...layer, opacity: opacity };
        }
        return layer;
      });
    });

    // If this is the active layer, also update the activeLayer state
    if (layerId === activeLayerId) {
      setActiveLayer((prev) => ({
        ...prev,
        layerOpacity: opacity,
      }));
    }
  };

  // Clear all strokes in the active layer
  const clearStrokes = () => {
    if (!activeLayerId) return;

    setLayers((prevLayers) =>
      prevLayers.map((layer) =>
        layer.id === activeLayerId ? { ...layer, lines: [] } : layer,
      ),
    );
  };

  // Delete a layer
  const deleteLayer = (layerId) => {
    if (layers.length <= 1) return; // Prevent deleting the last layer

    setLayers((prevLayers) => {
      const filteredLayers = prevLayers.filter((layer) => layer.id !== layerId);

      // If we deleted the active layer, set another layer as active
      if (layerId === activeLayerId && filteredLayers.length > 0) {
        const newActiveLayer = filteredLayers[0];
        setActiveLayerId(newActiveLayer.id);
        setActiveLayer((prev) => ({
          ...prev,
          id: newActiveLayer.id,
          layerOpacity: newActiveLayer.opacity,
        }));
      }

      return filteredLayers;
    });
  };

  // Render the stage with all layers
  return (
    <>
      <KonvaDrawAreaControls
        activeLayerId={activeLayerId}
        color={color}
        brushOpacity={brushOpacity}
        brushSize={brushSize}
        eraserBrushSize={eraserBrushSize}
        isEraser={isEraser}
        layerOpacity={activeLayer.layerOpacity}
        layers={layers}
        mode={mode}
        onLayerSelect={(id) => {
          setActiveLayerId(id);
          const layer = layers.find((l) => l.id === id);
          if (layer) {
            setActiveLayer((prev) => ({
              ...prev,
              id: id,
              layerOpacity: layer.opacity,
            }));
          }
        }}
        onAddLayer={addLayer}
        onDeleteLayer={deleteLayer}
        onClearStrokes={clearStrokes}
        onLayerOpacityChange={handleLayerOpacityChange}
        onBrushOpacityChange={(opacity) => {
          setBrushOpacity(opacity);
          setActiveLayer((prev) => ({
            ...prev,
            brushOpacity: opacity,
          }));
        }}
        onBrushSizeChange={setBrushSize}
        onEraserSizeChange={setEraserBrushSize}
        onColorChange={setColor}
        onToggleEraser={setIsEraser}
      />
      <section className="nodrag single-cell-container section-row-main section-key-value relative max-h-full min-w-0">
        <div className="single-cell-child single-cell-container">
          <Stage
            width={stageSize.width}
            height={stageSize.height}
            ref={stageRef}
            onMouseDown={handleMouseDown}
            onMousemove={handleMouseMove}
            onMouseup={handleMouseUp}
            onMouseleave={handleMouseUp}
          >
            <Layer>
              {/* Render each layer as a separate Group with its own opacity */}
              {layers.map((layer) => (
                <Group key={layer.id} opacity={layer.opacity}>
                  {/* For image layers */}
                  {layer.type === "image" && layer.imageObj && (
                    <Image image={layer.imageObj} />
                  )}

                  {/* For drawing layers - only render non-eraser strokes here */}
                  {layer.type === "drawing" &&
                    layer.lines
                      .filter((line) => !line.isEraser)
                      .map((line, i) => (
                        <Line
                          key={`${layer.id}-drawing-${i}`}
                          points={line.points}
                          stroke={line.color}
                          strokeWidth={line.strokeWidth}
                          tension={0.5}
                          lineCap="round"
                          lineJoin="round"
                          opacity={line.opacity}
                          globalCompositeOperation="source-over"
                        />
                      ))}
                </Group>
              ))}

              {/* Render eraser strokes for each layer */}
              {layers.map(
                (layer) =>
                  layer.type === "drawing" &&
                  layer.lines
                    .filter((line) => line.isEraser)
                    .map((line, i) => (
                      <Line
                        key={`${layer.id}-eraser-${i}`}
                        points={line.points}
                        stroke={line.color}
                        strokeWidth={line.strokeWidth}
                        tension={0.5}
                        lineCap="round"
                        lineJoin="round"
                        opacity={1} // Always full opacity for erasers
                        globalCompositeOperation="destination-out"
                      />
                    )),
              )}
            </Layer>
          </Stage>
        </div>
      </section>
    </>
  );
}
