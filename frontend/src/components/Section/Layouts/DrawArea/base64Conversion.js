export function dataURLToBase64(dataURL) {
  return dataURL.split(";base64,")[1];
}

export function canvasToBase64(canvas) {
  return dataURLToBase64(canvas.toDataURL("image/png"));
}

export async function base64ToImageObj(input_value) {
  const imgSrc = base64StrToImgSrc(input_value);
  const value = new Image();
  value.src = imgSrc;
  await value.decode();
  return value;
}

// Export all individual layers as an array of base64 strings
function allLayersToBase64Array(layerCanvases, layerIds) {
  return layerIds.map((layerId) => {
    const canvas = layerCanvases[layerId];
    if (canvas) {
      return canvasToBase64(canvas);
    }
    return null; // Or some default if the canvas doesn't exist
  });
}

function combinedLayersToBase64(layerCanvases, layerIds) {
  // Create a temporary canvas with the same dimensions as your layers
  const tempCanvas = document.createElement("canvas");
  const firstLayerCanvas = layerCanvases[layerIds[0]];
  tempCanvas.width = firstLayerCanvas.width;
  tempCanvas.height = firstLayerCanvas.height;

  const ctx = tempCanvas.getContext("2d");

  // Draw all layers in order (bottom to top)
  for (const layerId of layerIds) {
    const layerCanvas = layerCanvases[layerId];
    if (layerCanvas) {
      ctx.drawImage(layerCanvas, 0, 0);
    }
  }

  // Convert to base64
  return canvasToBase64(tempCanvas);
}

export function combinedAndSeparateLayersToBase64(layerCanvases, layerIds) {
  const drawing = combinedLayersToBase64(layerCanvases, layerIds);
  const layers = allLayersToBase64Array(layerCanvases, layerIds);
  return { drawing, layers };
}

// function exportStrokesToBase64(strokes, width, height) {
//   // Create a temporary canvas
//   const tempCanvas = document.createElement("canvas");
//   tempCanvas.width = width;
//   tempCanvas.height = height;
//   const tempCtx = tempCanvas.getContext("2d");

//   // Draw strokes on the temporary canvas
//   strokes.forEach((stroke) => {
//     drawStrokeOnTempCanvas(tempCanvas, tempCtx, stroke);
//   });

//   return canvasToBase64(tempCanvas);
// }

// function exportImageToBase64(image, width, height) {
//   // Create a temporary canvas
//   const tempCanvas = document.createElement("canvas");
//   tempCanvas.width = width;
//   tempCanvas.height = height;
//   const tempCtx = tempCanvas.getContext("2d");
//   tempCtx.drawImage(image, 0, 0);
//   return canvasToBase64(tempCanvas);
// }

// export function allPartsToBase64(canvasRef) {
//   const [width, height] = [canvasRef.current.width, canvasRef.current.height];
//   const base64 = {};
//   base64["completeCanvas"] = canvasToBase64(canvasRef.current);
//   base64["strokes"] = exportStrokesToBase64(strokesRef.current, width, height);
//   if (imageRef.current) {
//     base64["image"] = exportImageToBase64(imageRef.current, width, height);
//   }
//   return base64;
// }

function base64StrToImgSrc(base64Str) {
  return base64Str.startsWith("data:image/")
    ? base64Str
    : `data:image/png;base64,${base64Str}`;
}
