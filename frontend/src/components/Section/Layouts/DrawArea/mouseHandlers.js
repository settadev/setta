// mouseHandlers.js - Updated for dual-layer approach

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
  mergeActiveToResult,
}) {
  const handleMouseDown = useCallback((e) => {
    if (!stageRef.current) return;

    const currentMode = modeRef.current;
    const currentLayerId = activeLayerIdRef.current;
    const currentLayerPair = konvaLayersRef.current[currentLayerId];

    if (!currentLayerPair) return;

    // In edit mode, always work with the result layer
    // In drawing mode with brush, use active layer
    // In drawing mode with eraser, use result layer directly
    let currentLayer;
    if (currentMode === "edit") {
      currentLayer = currentLayerPair.result;
    } else if (currentMode === "eraser") {
      // Erasers work directly on the result layer for immediate effect
      currentLayer = currentLayerPair.result;
      // Clear cache during erasing for immediate visual feedback
      if (currentLayer.isCached()) {
        currentLayer.clearCache();
      }
    } else {
      // Normal brush drawing uses active layer
      currentLayer = currentLayerPair.active;
    }

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
      // Drawing behavior for brush/eraser modes - always on active layer
      isPaintRef.current = true;

      // Active layer is always uncached, so no need to clear cache
      const currentOpacity = opacityRef.current;
      const currentBrushSize = brushSizeRef.current;
      const currentEraserSize = eraserSizeRef.current;
      const currentBrushColor = brushColorRef.current;

      // Choose size based on current mode
      const strokeWidth =
        currentMode === "brush" ? currentBrushSize : currentEraserSize;

      // Get current layer opacity to properly calculate brush opacity
      const layerOpacity =
        layersRef.current.find((l) => l.id === currentLayerId)?.opacity || 1;

      // Create the new line
      lastLineRef.current = new Konva.Line({
        stroke: currentBrushColor,
        strokeWidth: strokeWidth,
        // For brushes, apply opacity based on brush and layer settings
        // For erasers, always use full opacity (1)
        opacity:
          currentMode === "brush"
            ? currentLayer === currentLayerPair.result
              ? currentOpacity * layerOpacity
              : currentOpacity
            : 1,
        // Store original opacity for future adjustments
        _originalOpacity: currentOpacity,
        _isEraser: currentMode === "eraser",
        globalCompositeOperation:
          currentMode === "brush" ? "source-over" : "destination-out",
        lineCap: "round",
        lineJoin: "round",
        points: [pos.x, pos.y, pos.x, pos.y],
        draggable: currentMode === "edit", // Only draggable in edit mode
        name: "drawingLine", // Add name for easier selection
      });

      // Add line to the active layer
      currentLayer.add(lastLineRef.current);

      // Store the line in the appropriate array
      if (!layerLinesRef.current[currentLayerId]) {
        layerLinesRef.current[currentLayerId] = { active: [], result: [] };
      }

      if (currentMode === "eraser") {
        // Store eraser strokes directly in result lines
        layerLinesRef.current[currentLayerId].result.push(lastLineRef.current);
      } else {
        layerLinesRef.current[currentLayerId].active.push(lastLineRef.current);
      }
    }
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!stageRef.current) return;

    const currentMode = modeRef.current;
    const currentLayerId = activeLayerIdRef.current;
    const currentLayerPair = konvaLayersRef.current[currentLayerId];

    if (!currentLayerPair) return;

    // Choose the appropriate layer based on mode
    let currentLayer;
    if (currentMode === "edit") {
      currentLayer = currentLayerPair.result;
    } else if (currentMode === "eraser") {
      // Erasers work directly on the result layer
      currentLayer = currentLayerPair.result;
    } else {
      // Normal brush drawing uses active layer
      currentLayer = currentLayerPair.active;
    }

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
      // Drawing behavior - active layer is always uncached for best performance
      e.evt.preventDefault();

      const newPoints = lastLineRef.current.points().concat([pos.x, pos.y]);
      lastLineRef.current.points(newPoints);

      // Just draw - active layer is always uncached
      currentLayer.batchDraw();
    }
  }, []);

  const handleMouseUp = useCallback(
    (e) => {
      const currentMode = modeRef.current;
      const currentLayerId = activeLayerIdRef.current;
      const currentLayerPair = konvaLayersRef.current[currentLayerId];

      if (!currentLayerPair) return;

      let currentLayer;
      if (currentMode === "edit") {
        currentLayer = currentLayerPair.result;
      } else if (currentMode === "eraser") {
        currentLayer = currentLayerPair.result;
      } else {
        currentLayer = currentLayerPair.active;
      }

      if (currentMode === "edit" && isSelectingRef.current) {
        // Finish selection rectangle and select contained lines
        isSelectingRef.current = false;

        if (
          selectionRectangleRef.current &&
          selectionRectangleRef.current.visible()
        ) {
          const selectionBox = selectionRectangleRef.current.getClientRect();

          // Find all lines in the result layer
          const lines = currentLayerPair.result.find(".drawingLine");

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
        // Finish drawing a stroke
        isPaintRef.current = false;

        if (currentMode === "brush") {
          // Only merge brush strokes from active to result layer
          mergeActiveToResult(currentLayerId);
        } else if (currentMode === "eraser") {
          // For eraser strokes, they're already on the result layer
          // We just need to update the cache
          updateLayerCache(currentLayerId);
        }
      }
    },
    [updateLayerCache, mergeActiveToResult],
  );

  return { handleMouseDown, handleMouseMove, handleMouseUp };
}
