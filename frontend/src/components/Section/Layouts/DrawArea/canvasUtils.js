import _ from "lodash";
import { sendToInteractiveTasks } from "state/actions/interactive";
import { maybeIncrementProjectStateVersion } from "state/actions/undo";
import { useArtifacts, useSectionInfos } from "state/definitions";
import { setDrawAreaSectionSize } from "state/hooks/sectionSizes";

export const RESIZE_HANDLE_SIZE = 16;

export function setDraftCanvasProperties({
  draftCanvasRef,
  color,
  brushSize,
  brushShape,
  brushOpacity,
  layerOpacity,
}) {
  const dCtx = getCtx(draftCanvasRef.current);
  dCtx.globalCompositeOperation = "source-over";
  dCtx.strokeStyle = hexToRGBA(color, brushOpacity);
  dCtx.lineWidth = brushSize;
  dCtx.lineCap = brushShape;
  dCtx.globalAlpha = layerOpacity;
}

// ctx.save() -> ctx.restore() doesn't work: https://stackoverflow.com/questions/48044951/canvas-state-lost-after-changing-size
function resizeDraftCanvasAndKeepProperties(draftCanvasRef, width, height) {
  const dCtx = getCtx(draftCanvasRef.current);
  const {
    globalCompositeOperation,
    strokeStyle,
    lineWidth,
    lineCap,
    globalAlpha,
  } = dCtx;
  draftCanvasRef.current.width = width;
  draftCanvasRef.current.height = height;
  dCtx.globalCompositeOperation = globalCompositeOperation;
  dCtx.strokeStyle = strokeStyle;
  dCtx.lineWidth = lineWidth;
  dCtx.lineCap = lineCap;
  dCtx.globalAlpha = globalAlpha;
}

export function setCanvasSize({
  sectionId,
  canvasRef,
  tempCanvasRefs,
  draftCanvasRef,
  height,
  width,
  artifactIdUsedToSetCanvasSize,
  state,
}) {
  const sectionState = useSectionInfos.getState();
  const artifactState = useArtifacts.getState().x;
  let imgSize = maybeGetImgSizeFromArtifact(
    artifactState[artifactIdUsedToSetCanvasSize],
  );
  let isNewImg = false;

  if (!imgSize) {
    for (const layerId of sectionState.x[sectionId].artifactGroupIds) {
      const layer = sectionState.artifactGroups[layerId];

      for (const t of layer.artifactTransforms) {
        const id = t.artifactId;
        if (!(id in artifactState)) {
          continue;
        }
        const artifact = artifactState[id];
        imgSize = maybeGetImgSizeFromArtifact(artifact);
        if (imgSize) {
          state.x[sectionId].canvasSettings.artifactIdUsedToSetCanvasSize = id;
          isNewImg = true;
          break;
        }
      }

      if (imgSize) {
        break;
      }
    }
  }

  const canvasSize = setDrawAreaSectionSize({
    sectionId,
    imgSize,
    isNewImg,
    sectionHeight: height,
    sectionWidth: width,
    state,
  });

  canvasRef.current.width = canvasSize.width;
  canvasRef.current.height = canvasSize.height;

  for (const c of Object.values(tempCanvasRefs.current)) {
    c.width = canvasSize.width;
    c.height = canvasSize.height;
  }

  resizeDraftCanvasAndKeepProperties(
    draftCanvasRef,
    canvasSize.width,
    canvasSize.height,
  );
}

export function getXY(e) {
  const { offsetX, offsetY } = e.nativeEvent;
  return [offsetX, offsetY];
}

function clearCanvas(canvas) {
  const ctx = getCtx(canvas);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function getCtx(canvas) {
  return canvas.getContext("2d");
}

export function setGlobalBrushStrokesAndDrawAllLayers(
  sectionId,
  currBrushStrokeArtifactId,
  strokesRef,
  canvasRef,
  tempCanvasRefs,
  draftCanvasRef,
  incrementVersion = true,
) {
  useArtifacts.setState((state) => ({
    x: {
      ...state.x,
      [currBrushStrokeArtifactId]: {
        ...state.x[currBrushStrokeArtifactId],
        value: _.cloneDeep(strokesRef.current),
      },
    },
  }));
  drawAllLayers(sectionId, canvasRef, tempCanvasRefs);
  clearCanvas(draftCanvasRef.current);
  maybeIncrementProjectStateVersion(incrementVersion);
}

export function setGlobalArtifactTransformsAndDrawAllLayers(
  sectionId,
  activeLayerId,
  localArtifactTransformsRef,
  resizeHandleCorners,
  canvasRef,
  tempCanvasRefs,
) {
  useSectionInfos.setState((state) => {
    for (const [idx, t] of state.artifactGroups[
      activeLayerId
    ].artifactTransforms.entries()) {
      const { transform, eraserStrokes } =
        localArtifactTransformsRef.current[idx];
      t.transform = _.cloneDeep(transform);
      t.eraserStrokes = _.cloneDeep(eraserStrokes);
    }
  });

  drawAllLayers(
    sectionId,
    canvasRef,
    tempCanvasRefs,
    {},
    {},
    { [activeLayerId]: resizeHandleCorners.current },
  );

  maybeIncrementProjectStateVersion(true);
}

export function drawAllLayers(
  sectionId,
  canvasRef,
  tempCanvasRefs,
  realTimeValues = {}, // layerId -> artifactId -> value
  realTimeTransforms = {}, // layerId -> idx -> {transform, eraserStrokes}
  realTimeResizeHandles = {}, // layerId -> array of corner coordinates
  realTimeEraserStrokes = {}, // layerId -> eraserStrokes array
) {
  const ctx = getCtx(canvasRef.current);
  const layerTempCanvas = tempCanvasRefs.current.layer;
  const layerTempCtx = getCtx(tempCanvasRefs.current.layer);
  const artifactTempCanvas = tempCanvasRefs.current.artifact;
  const artifactTempCtx = getCtx(tempCanvasRefs.current.artifact);
  clearCanvas(canvasRef.current);

  const sectionState = useSectionInfos.getState();
  const artifactState = useArtifacts.getState().x;
  for (const layerId of sectionState.x[sectionId].artifactGroupIds) {
    const layer = sectionState.artifactGroups[layerId];
    if (!layer.visible) {
      continue;
    }
    const { layerOpacity } = layer;

    for (const [idx, t] of layer.artifactTransforms.entries()) {
      const id = t.artifactId;
      if (!(id in artifactState)) {
        return;
      }
      const artifact = artifactState[id];

      artifactTempCtx.globalAlpha = 1;
      artifactTempCtx.globalCompositeOperation = "source-over";

      if (
        artifact.type === "img" &&
        artifact.value instanceof Image &&
        artifact.value.complete
      ) {
        const image = realTimeValues[layerId]?.[id] ?? artifact.value;
        const transformInfo = realTimeTransforms[layerId]?.[idx] ?? t;
        artifactTempCtx.setTransform(...transformInfo.transform);
        artifactTempCtx.drawImage(image, 0, 0, image.width, image.height);
        drawStrokesOntoTempCanvas(
          artifactTempCtx,
          transformInfo.eraserStrokes,
          transformInfo.transform,
        );
      } else if (
        artifact.type === "brushStrokes" &&
        artifact.value.length > 0
      ) {
        const strokes = realTimeValues[layerId]?.[id] ?? artifact.value;
        const artifactTransformInfo = realTimeTransforms[layerId]?.[idx] ?? t;
        drawStrokesOntoTempCanvas(
          artifactTempCtx,
          strokes,
          artifactTransformInfo.transform,
          artifactTransformInfo.eraserStrokes,
        );
      }

      artifactTempCtx.resetTransform(); // MUST reset, otherwise get smudging when moving images around. No idea why

      layerTempCtx.globalAlpha = 1;
      layerTempCtx.globalCompositeOperation = "source-over";
      layerTempCtx.drawImage(artifactTempCanvas, 0, 0);

      clearCanvas(tempCanvasRefs.current.artifact);
    }

    if (realTimeEraserStrokes[layerId]) {
      drawStrokesOntoTempCanvas(layerTempCtx, realTimeEraserStrokes[layerId]);
    }

    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = layerOpacity;
    ctx.drawImage(layerTempCanvas, 0, 0);

    if (realTimeResizeHandles[layerId]) {
      drawResizeHandles(ctx, realTimeResizeHandles[layerId]);
    }

    clearCanvas(tempCanvasRefs.current.layer);
  }
}

export function startNewStroke(
  draftCanvasRef,
  strokesRef,
  firstPoint,
  currentTransform,
) {
  const dCtx = getCtx(draftCanvasRef.current);
  strokesRef.current.push({
    strokeStyle: dCtx.strokeStyle,
    lineWidth: dCtx.lineWidth,
    lineCap: dCtx.lineCap,
    points: [firstPoint],
    // canvasHeight: draftCanvas.height,
    // canvasWidth: draftCanvas.width,
    globalCompositeOperation: dCtx.globalCompositeOperation,
    transform: _.cloneDeep(currentTransform),
  });
  drawStroke(draftCanvasRef, firstPoint, firstPoint);
}

export function startNewEraserStroke(
  eraserStrokesRef,
  eraserBrushSize,
  brushShape,
  firstPoint,
) {
  eraserStrokesRef.current.push({
    strokeStyle: "rgba(0,0,0,1)",
    lineWidth: eraserBrushSize,
    lineCap: brushShape,
    points: [firstPoint],
    // canvasHeight: draftCanvas.height,
    // canvasWidth: draftCanvas.width,
    globalCompositeOperation: "destination-out",
  });
}

function drawStrokesOntoTempCanvas(
  ctx,
  strokes,
  artifactTransform = null,
  pairedStrokes = {},
) {
  for (const [idx, stroke] of strokes.entries()) {
    // const scale = Math.min(
    //   canvas.width / stroke.canvasWidth,
    //   canvas.height / stroke.canvasHeight,
    // );
    // ctx.scale(scale, scale);
    drawStrokeOntoTempCanvas(ctx, stroke, artifactTransform);
    if (pairedStrokes[idx]) {
      for (const pairedStroke of pairedStrokes[idx]) {
        drawStrokeOntoTempCanvas(ctx, pairedStroke, artifactTransform);
      }
    }
  }
}

function drawStrokeOntoTempCanvas(ctx, stroke, artifactTransform) {
  const transform = getCombinedTransformForStroke(
    artifactTransform,
    stroke.transform,
  );
  if (transform) {
    ctx.setTransform(...transform);
  }
  ctx.beginPath();
  ctx.globalCompositeOperation = stroke.globalCompositeOperation;
  ctx.strokeStyle = stroke.strokeStyle;
  ctx.globalAlpha = 1;
  ctx.lineWidth = stroke.lineWidth;
  ctx.lineCap = stroke.lineCap;
  let prevPoint = stroke.points[0];
  stroke.points.forEach((point) => {
    ctx.moveTo(prevPoint[0], prevPoint[1]);
    ctx.lineTo(point[0], point[1]);
    prevPoint = point;
  });
  ctx.stroke();
}

export function drawStroke(canvasRef, from, to) {
  const ctx = getCtx(canvasRef.current);
  ctx.beginPath();
  ctx.moveTo(from[0], from[1]);
  ctx.lineTo(to[0], to[1]);
  ctx.stroke();
}

function drawResizeHandles(ctx, resizeHandles) {
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#4299e1"; // blue-500

  resizeHandles.forEach((corner) => {
    ctx.fillRect(
      corner.x - RESIZE_HANDLE_SIZE / 2,
      corner.y - RESIZE_HANDLE_SIZE / 2,
      RESIZE_HANDLE_SIZE,
      RESIZE_HANDLE_SIZE,
    );
  });
}

export function getCombinedTransformForStroke(
  artifactTransform,
  strokeTransform,
) {
  if (!artifactTransform && !strokeTransform) {
    return null;
  }
  if (!strokeTransform) {
    return artifactTransform;
  }
  if (!artifactTransform) {
    return strokeTransform;
  }

  return [
    artifactTransform[0] * strokeTransform[0], // multiply scales
    0,
    0,
    artifactTransform[3] * strokeTransform[3], // multiply scales
    artifactTransform[4] + strokeTransform[4] * artifactTransform[0], // transform the translation
    artifactTransform[5] + strokeTransform[5] * artifactTransform[3], // transform the translation
  ];
}

export function getInverseTransform(transform) {
  // Inverse transform:
  // - Divide by scale instead of multiply
  // - Subtract translated position divided by scale
  return [
    1 / transform[0],
    0,
    0,
    1 / transform[3],
    -transform[4] / transform[0],
    -transform[5] / transform[3],
  ];
}

function hexToRGBA(_hex, opacity) {
  // Remove # if present
  const hex = _hex.replace("#", "");

  // Parse r, g, b values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

function maybeGetImgSizeFromArtifact(artifact) {
  if (artifact?.type === "img" && artifact?.value?.complete) {
    const image = artifact.value;
    return { width: image.width, height: image.height };
  }
  return null;
}

export const sendDrawingToInteractiveTasks = _.throttle(
  (sectionId, fnToBase64) => {
    sendToInteractiveTasks([sectionId, "drawing"], null, fnToBase64);
  },
  200,
);
