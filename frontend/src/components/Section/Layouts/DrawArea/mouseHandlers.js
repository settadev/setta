import Konva from "konva";
import { useCallback } from "react";

export function useMouseHandlers({
  stageRef,
  modeRef,
  activeLayerIdRef,
  konvaLayersRef,
  isSelectingRef,
  selectionStartRef,
  selectionRectangleRef,
  transformerRef,
  selectedNodesRef,
  isPaintRef,
  opacityRef,
  brushSizeRef,
  eraserSizeRef,
  brushColorRef,
  lastLineRef,
  layerLinesRef,
  layersRef,
  updateLayerCache,
  prepareLineForTransform,
}) {
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
          pixelRatio: window.devicePixelRatio || 2,
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

  return { handleMouseDown, handleMouseMove, handleMouseUp };
}
