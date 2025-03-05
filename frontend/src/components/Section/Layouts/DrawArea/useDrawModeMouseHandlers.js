import { getZoom } from "forks/xyflow/core/hooks/useViewportHelper";
import _ from "lodash";
import { useCallback } from "react";
import { setActiveSectionIdAndUpdateZIndex } from "state/actions/activeSections";
import { useArtifacts, useMisc, useSectionInfos } from "state/definitions";
import {
  drawAllLayers,
  drawStroke,
  getInverseTransform,
  getXY,
  RESIZE_HANDLE_SIZE,
  sendDrawingToInteractiveTasks,
  setGlobalArtifactTransformsAndDrawAllLayers,
  setGlobalBrushStrokesAndDrawAllLayers,
  startNewEraserStroke,
  startNewStroke,
} from "./canvasUtils";
import { filterEraserPath } from "./eraserIntersection";
import {
  detectHit,
  getBrushStrokesBounds,
  getImageBounds,
  getImageHandleBehaviorFn,
  getPseudoBoundsFromResizeHandleCorners,
  getScaledHeight,
  getScaledWidth,
  getTrueBoundsFromResizeHandleCorners,
  incrementResizeHandleCorners,
  preventExactZero,
  setResizeHandleCorners,
} from "./mouseHandlerUtils";

export function useDrawModeMouseHandlers({
  sectionId,
  isEraser,
  strokesRef,
  eraserStrokesRef,
  prevPointRef,
  eraserBrushSize,
  brushShape,
  isDrawing,
  setIsDrawing,
  isDragging,
  draggedIdx,
  lastPos,
  selectedIdx,
  resizeHandle,
  resizeHandleCorners,
  drawThrottleDelay,
  layerCanvasRefs,
  tempCanvasRefs,
  draftCanvasRef,
  canvasTransferQueueLength,
  currBrushStrokeArtifactId,
  activeLayerId,
  localArtifactTransformsRef,
  mode,
  fnCanvasToBase64,
}) {
  let onMouseDown, onMouseMove, onMouseUp, onMouseEnter;
  let redrawLayers, didChange;

  if (mode === "draw") {
    const onMouseDownCore = drawingOnMouseDown({
      sectionId,
      isEraser,
      strokesRef,
      eraserStrokesRef,
      eraserBrushSize,
      brushShape,
      prevPointRef,
      setIsDrawing,
      layerCanvasRefs,
      tempCanvasRefs,
      draftCanvasRef,
      activeLayerId,
      currBrushStrokeArtifactId,
      localArtifactTransformsRef,
    });

    onMouseDown = (...props) => {
      didChange = onMouseDownCore(...props);
      if (didChange) {
        sendDrawingToInteractiveTasks(sectionId, fnCanvasToBase64);
      }
    };

    const onMouseMoveCore = drawingOnMouseMove({
      sectionId,
      isEraser,
      strokesRef,
      eraserStrokesRef,
      prevPointRef,
      isDrawing,
      layerCanvasRefs,
      tempCanvasRefs,
      draftCanvasRef,
      canvasTransferQueueLength,
      activeLayerId,
      currBrushStrokeArtifactId,
      localArtifactTransformsRef,
    });

    onMouseMove = (...props) => {
      didChange = onMouseMoveCore(...props);
      if (didChange) {
        sendDrawingToInteractiveTasks(sectionId, fnCanvasToBase64);
      }
    };

    const onMouseUpCore = drawingOnMouseUp({
      sectionId,
      isEraser,
      eraserStrokesRef,
      isDrawing,
      setIsDrawing,
      activeLayerId,
      currBrushStrokeArtifactId,
      strokesRef,
      layerCanvasRefs,
      tempCanvasRefs,
      draftCanvasRef,
    });

    onMouseUp = (...props) => {
      didChange = onMouseUpCore(...props);
      if (didChange) {
        sendDrawingToInteractiveTasks(sectionId, fnCanvasToBase64);
      }
    };

    onMouseEnter = drawingOnMouseEnter({ draftCanvasRef, onMouseDown });
  } else {
    const onMouseDownCore = editingOnMouseDown({
      layerCanvasRefs,
      selectedIdx,
      localArtifactTransformsRef,
      resizeHandle,
      resizeHandleCorners,
      lastPos,
      draggedIdx,
      isDragging,
      activeLayerId,
    });

    onMouseDown = (...props) => {
      redrawLayers = onMouseDownCore(...props);
      if (redrawLayers) {
        drawAllLayers(
          sectionId,
          layerCanvasRefs,
          tempCanvasRefs,
          {},
          { [activeLayerId]: localArtifactTransformsRef.current },
          { [activeLayerId]: resizeHandleCorners.current },
        );
        sendDrawingToInteractiveTasks(sectionId, fnCanvasToBase64);
      }
    };

    const onMouseMoveCore = editingOnMouseMove({
      layerCanvasRefs,
      isDragging,
      lastPos,
      resizeHandle,
      resizeHandleCorners,
      selectedIdx,
      draggedIdx,
      localArtifactTransformsRef,
      activeLayerId,
    });

    onMouseMove = (...props) => {
      redrawLayers = onMouseMoveCore(...props);
      if (redrawLayers) {
        drawAllLayers(
          sectionId,
          layerCanvasRefs,
          tempCanvasRefs,
          {},
          { [activeLayerId]: localArtifactTransformsRef.current },
          { [activeLayerId]: resizeHandleCorners.current },
        );
        sendDrawingToInteractiveTasks(sectionId, fnCanvasToBase64);
      }
    };

    const onMouseUpCore = editingOnMouseUp({
      sectionId,
      isDragging,
      draggedIdx,
      resizeHandle,
      resizeHandleCorners,
      activeLayerId,
      localArtifactTransformsRef,
      layerCanvasRefs,
      tempCanvasRefs,
    });

    onMouseUp = (...props) => {
      onMouseUpCore(...props);
      sendDrawingToInteractiveTasks(sectionId, fnCanvasToBase64);
    };

    onMouseEnter = () => {};
  }

  // useCallback so that throttle function doesn't get recreated and reset timer
  const throttledOnMouseMove = useCallback(
    mode === "draw" && drawThrottleDelay > 0
      ? _.throttle(onMouseMove, drawThrottleDelay)
      : onMouseMove,
    [onMouseMove, drawThrottleDelay],
  );

  return {
    onMouseDown,
    onMouseMove: throttledOnMouseMove,
    onMouseUp,
    onMouseEnter,
  };
}

function drawingOnMouseDown({
  sectionId,
  isEraser,
  strokesRef,
  eraserStrokesRef,
  eraserBrushSize,
  brushShape,
  prevPointRef,
  setIsDrawing,
  layerCanvasRefs,
  tempCanvasRefs,
  draftCanvasRef,
  activeLayerId,
  currBrushStrokeArtifactId,
  localArtifactTransformsRef,
}) {
  return (e, offsetX, offsetY) => {
    if (useMisc.getState().mouseDownDraggingSection) {
      return false;
    }

    let didDraw = false;

    if (!useMisc.getState().mouseDownDrawArea) {
      // We want to do this just on the first mouse down.
      setActiveSectionIdAndUpdateZIndex(sectionId);
    }
    useMisc.setState({ mouseDownDrawArea: true });

    setIsDrawing(true);
    let point;
    if (offsetX && offsetY) {
      point = [offsetX, offsetY];
    } else {
      point = getXY(e);
    }
    if (isEraser) {
      startNewEraserStroke(
        eraserStrokesRef,
        eraserBrushSize,
        brushShape,
        point,
      );
      drawAllLayers(
        sectionId,
        layerCanvasRefs,
        tempCanvasRefs,
        {},
        {},
        {},
        { [activeLayerId]: eraserStrokesRef.current },
      );
      didDraw = true;
    } else {
      const currentBrushStrokeTransformInfo =
        localArtifactTransformsRef.current.find(
          (l) => l.artifactId === currBrushStrokeArtifactId,
        );
      if (currentBrushStrokeTransformInfo) {
        startNewStroke(
          draftCanvasRef,
          strokesRef,
          point,
          getInverseTransform(currentBrushStrokeTransformInfo.transform),
        );
        didDraw = true;
      }
    }

    prevPointRef.current = point;

    return didDraw;
  };
}

function drawingOnMouseMove({
  sectionId,
  isEraser,
  strokesRef,
  eraserStrokesRef,
  prevPointRef,
  isDrawing,
  layerCanvasRefs,
  tempCanvasRefs,
  draftCanvasRef,
  canvasTransferQueueLength,
  activeLayerId,
  currBrushStrokeArtifactId,
  localArtifactTransformsRef,
}) {
  return (e) => {
    if (!isDrawing) {
      return false;
    }
    const point = getXY(e);
    const currStrokesRef = isEraser ? eraserStrokesRef : strokesRef;
    const currStroke =
      currStrokesRef.current[currStrokesRef.current.length - 1];
    if (!currStroke) {
      return false;
    }

    if (isEraser) {
      currStroke.points.push(point);
      prevPointRef.current = point;
      drawAllLayers(
        sectionId,
        layerCanvasRefs,
        tempCanvasRefs,
        {},
        {},
        {},
        { [activeLayerId]: eraserStrokesRef.current },
      );
    } else if (currStroke.points.length >= canvasTransferQueueLength) {
      setGlobalBrushStrokesAndDrawAllLayers(
        sectionId,
        currBrushStrokeArtifactId,
        strokesRef,
        layerCanvasRefs,
        tempCanvasRefs,
        draftCanvasRef,
        false,
      );
      const currentBrushStrokeTransformInfo =
        localArtifactTransformsRef.current.find(
          (l) => l.artifactId === currBrushStrokeArtifactId,
        );
      if (currentBrushStrokeTransformInfo) {
        startNewStroke(
          draftCanvasRef,
          currStrokesRef,
          point,
          getInverseTransform(currentBrushStrokeTransformInfo.transform),
        );
      }
      prevPointRef.current = point;
    } else {
      drawStroke(draftCanvasRef, prevPointRef.current, point);
      currStroke.points.push(point);
      prevPointRef.current = point;
    }

    return true;
  };
}

function drawingOnMouseUp({
  sectionId,
  isEraser,
  eraserStrokesRef,
  isDrawing,
  setIsDrawing,
  activeLayerId,
  currBrushStrokeArtifactId,
  strokesRef,
  layerCanvasRefs,
  tempCanvasRefs,
  draftCanvasRef,
}) {
  return () => {
    if (!isDrawing) {
      return false;
    }
    if (isEraser) {
      const artifactState = useArtifacts.getState().x;
      const eraserPath =
        eraserStrokesRef.current[eraserStrokesRef.current.length - 1];

      useSectionInfos.setState((state) => {
        const layer = state.artifactGroups[activeLayerId];
        for (const t of layer.artifactTransforms) {
          const artifact = artifactState[t.artifactId];
          const inverseTransform = getInverseTransform(t.transform);
          const boundsFn =
            artifact.type === "img" ? getImageBounds : getBrushStrokesBounds;

          const intersectingPath = filterEraserPath(
            eraserPath.points,
            eraserPath.lineWidth,
            eraserPath.lineCap,
            boundsFn(artifact.value, t.transform),
          );

          if (artifact.type === "img") {
            if (intersectingPath.length > 0) {
              t.eraserStrokes.push({
                ...eraserPath,
                points: intersectingPath,
                transform: inverseTransform,
              });
            }
          } else {
            for (const [idx] of artifact.value.entries()) {
              if (intersectingPath.length > 0) {
                if (!(idx in t.eraserStrokes)) {
                  t.eraserStrokes[idx] = [];
                }
                t.eraserStrokes[idx].push({
                  ...eraserPath,
                  points: intersectingPath,
                  transform: inverseTransform,
                });
              }
            }
          }
        }
      });

      eraserStrokesRef.current = [];
    }
    setIsDrawing(false);
    setGlobalBrushStrokesAndDrawAllLayers(
      sectionId,
      currBrushStrokeArtifactId,
      strokesRef,
      layerCanvasRefs,
      tempCanvasRefs,
      draftCanvasRef,
    );

    return true;
  };
}

function drawingOnMouseEnter({ draftCanvasRef, onMouseDown }) {
  return (e) => {
    if (e.buttons === 1) {
      // have to compute offset this way for some reason
      // otherwise it's inaccurate
      const zoom = getZoom();
      const rect = draftCanvasRef.current.getBoundingClientRect();
      const offsetX = (e.clientX - rect.left) / zoom;
      const offsetY = (e.clientY - rect.top) / zoom;
      onMouseDown(e, offsetX, offsetY);
    }
  };
}

function editingOnMouseDown({
  layerCanvasRefs,
  selectedIdx,
  localArtifactTransformsRef,
  resizeHandle,
  resizeHandleCorners,
  lastPos,
  draggedIdx,
  isDragging,
  activeLayerId,
}) {
  // returns true if layers should be redrawn
  return (e) => {
    const artifactState = useArtifacts.getState().x;
    const canvas = layerCanvasRefs.current[activeLayerId];
    const rect = canvas.getBoundingClientRect();
    const zoom = getZoom();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    if (selectedIdx.current !== null) {
      for (let i = 0; i < resizeHandleCorners.current.length; i++) {
        const corner = resizeHandleCorners.current[i];
        if (
          Math.abs(x - corner.x) <= RESIZE_HANDLE_SIZE / 2 &&
          Math.abs(y - corner.y) <= RESIZE_HANDLE_SIZE / 2
        ) {
          const currTransform =
            localArtifactTransformsRef.current[selectedIdx.current].transform;
          resizeHandle.current = {
            idx: i,
            wasPositive: {
              xScale: currTransform[0] >= 0,
              yScale: currTransform[3] >= 0,
            },
          };
          lastPos.current = { x, y };
          return true;
        }
      }
    }

    for (let i = localArtifactTransformsRef.current.length - 1; i >= 0; i--) {
      const { transform, artifactId } = localArtifactTransformsRef.current[i];
      const artifact = artifactState[artifactId];
      if (artifact.type === "img") {
        const bounds = getImageBounds(artifact.value, transform);
        if (
          x >= bounds.minX &&
          x <= bounds.maxX &&
          y >= bounds.minY &&
          y <= bounds.maxY
        ) {
          setResizeHandleCorners(resizeHandleCorners, bounds);
          isDragging.current = true;
          draggedIdx.current = i;
          selectedIdx.current = i;
          lastPos.current = { x, y };
          return true;
        }
      } else if (artifact.type === "brushStrokes") {
        const hit = detectHit(x, y, artifact, transform);
        if (hit) {
          const bounds = getBrushStrokesBounds(artifact.value, transform);
          setResizeHandleCorners(resizeHandleCorners, bounds);
          isDragging.current = true;
          draggedIdx.current = i;
          selectedIdx.current = i;
          lastPos.current = { x, y };
          return true;
        }
      }
    }
    selectedIdx.current = null;
    resizeHandleCorners.current = null;
    return false;
  };
}

function editingOnMouseMove({
  layerCanvasRefs,
  isDragging,
  lastPos,
  resizeHandle,
  resizeHandleCorners,
  selectedIdx,
  draggedIdx,
  localArtifactTransformsRef,
  activeLayerId,
}) {
  // returns true if layers should be redrawn
  return (e) => {
    if (!isDragging.current && resizeHandle.current === null) return false;

    const artifactState = useArtifacts.getState().x;
    const canvas = layerCanvasRefs.current[activeLayerId];
    const rect = canvas.getBoundingClientRect();
    const zoom = getZoom();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    const dx = x - lastPos.current.x;
    const dy = y - lastPos.current.y;

    if (isDragging.current && draggedIdx.current !== null) {
      const { transform } =
        localArtifactTransformsRef.current[draggedIdx.current];
      transform[4] += dx;
      transform[5] += dy;
      lastPos.current = { x, y };
      resizeHandleCorners.current = resizeHandleCorners.current.map((c) => ({
        x: c.x + dx,
        y: c.y + dy,
      }));
    } else if (resizeHandle.current !== null && selectedIdx.current !== null) {
      const { transform, artifactId } =
        localArtifactTransformsRef.current[selectedIdx.current];
      const artifact = artifactState[artifactId];

      if (artifact.type === "img") {
        const scaledWidth = getScaledWidth(artifact.value, transform);
        const scaledHeight = getScaledHeight(artifact.value, transform);
        const handleBehaviorFn = getImageHandleBehaviorFn(
          resizeHandle.current.idx,
          resizeHandle.current.wasPositive.xScale,
          resizeHandle.current.wasPositive.yScale,
        );
        handleBehaviorFn(
          transform,
          scaledWidth,
          scaledHeight,
          dx,
          dy,
          artifact,
        );
      } else if (artifact.type === "brushStrokes") {
        const bounds =
          getPseudoBoundsFromResizeHandleCorners(resizeHandleCorners);
        const width = bounds.maxX - bounds.minX;
        const height = bounds.maxY - bounds.minY;

        switch (resizeHandle.current.idx) {
          case 0: {
            // Top-left
            const scaleX = (width - dx) / width;
            const scaleY = (height - dy) / height;

            // Anchor point is bottom-right
            const anchorX = bounds.maxX;
            const anchorY = bounds.maxY;

            transform[0] = preventExactZero(transform[0] * scaleX);
            transform[3] = preventExactZero(transform[3] * scaleY);
            transform[4] = anchorX - (anchorX - transform[4]) * scaleX;
            transform[5] = anchorY - (anchorY - transform[5]) * scaleY;

            break;
          }
          case 1: {
            // Top-right
            const scaleX = (width + dx) / width;
            const scaleY = (height - dy) / height;

            // Anchor point is bottom-left
            const anchorX = bounds.minX;
            const anchorY = bounds.maxY;

            transform[0] = preventExactZero(transform[0] * scaleX);
            transform[3] = preventExactZero(transform[3] * scaleY);
            transform[4] = anchorX - (anchorX - transform[4]) * scaleX;
            transform[5] = anchorY - (anchorY - transform[5]) * scaleY;

            break;
          }
          case 2: {
            // Bottom-left
            const scaleX = (width - dx) / width;
            const scaleY = (height + dy) / height;

            // Anchor point is top-right
            const anchorX = bounds.maxX;
            const anchorY = bounds.minY;

            transform[0] = preventExactZero(transform[0] * scaleX);
            transform[3] = preventExactZero(transform[3] * scaleY);
            transform[4] = anchorX - (anchorX - transform[4]) * scaleX;
            transform[5] = anchorY - (anchorY - transform[5]) * scaleY;

            break;
          }
          case 3: {
            // Bottom-right
            const scaleX = (width + dx) / width;
            const scaleY = (height + dy) / height;

            // Anchor point is top-left
            const anchorX = bounds.minX;
            const anchorY = bounds.minY;

            transform[0] = preventExactZero(transform[0] * scaleX);
            transform[3] = preventExactZero(transform[3] * scaleY);
            transform[4] = anchorX - (anchorX - transform[4]) * scaleX;
            transform[5] = anchorY - (anchorY - transform[5]) * scaleY;
            break;
          }
        }
      }

      incrementResizeHandleCorners(
        resizeHandle,
        resizeHandleCorners,
        dx,
        dy,
        transform,
      );

      lastPos.current = { x, y };
    }

    return true;
  };
}

function editingOnMouseUp({
  sectionId,
  isDragging,
  draggedIdx,
  resizeHandle,
  resizeHandleCorners,
  activeLayerId,
  localArtifactTransformsRef,
  layerCanvasRefs,
  tempCanvasRefs,
}) {
  return () => {
    // have to update the corners
    // in case the x or y scaling went from positive to negative or vice versa
    if (resizeHandleCorners.current) {
      setResizeHandleCorners(
        resizeHandleCorners,
        getTrueBoundsFromResizeHandleCorners(resizeHandleCorners),
      );
    }
    setGlobalArtifactTransformsAndDrawAllLayers(
      sectionId,
      activeLayerId,
      localArtifactTransformsRef,
      resizeHandleCorners,
      layerCanvasRefs,
      tempCanvasRefs,
    );
    isDragging.current = false;
    draggedIdx.current = null;
    resizeHandle.current = null;
  };
}
