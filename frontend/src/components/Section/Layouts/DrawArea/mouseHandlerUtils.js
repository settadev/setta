import { getCombinedTransformForStroke } from "./canvasUtils";
import { getTransformedPoints, isPointOnStroke } from "./lowLevelStrokeUtils";

export const getBrushStrokesBounds = (strokes, artifactTransform) => {
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  for (const stroke of strokes) {
    const combinedTransform = getCombinedTransformForStroke(
      artifactTransform,
      stroke.transform,
    );
    for (const point of getTransformedPoints(
      stroke.points,
      combinedTransform,
    )) {
      if (point[0] < minX) minX = point[0];
      if (point[1] < minY) minY = point[1];
      if (point[0] > maxX) maxX = point[0];
      if (point[1] > maxY) maxY = point[1];
    }
  }
  return {
    minX,
    maxX,
    minY,
    maxY,
  };
};

export function incrementResizeHandleCorners(
  resizeHandle,
  resizeHandleCorners,
  dx,
  dy,
) {
  switch (resizeHandle.current.idx) {
    case 0: // Top-left
      // Top-left handle
      resizeHandleCorners.current[0].x += dx;
      resizeHandleCorners.current[0].y += dy;
      // Top-right handle
      resizeHandleCorners.current[1].y += dy;
      // Bottom-left handle
      resizeHandleCorners.current[2].x += dx;
      break;
    case 1: // Top-right
      // Top-left handle
      resizeHandleCorners.current[0].y += dy;
      // Top-right handle
      resizeHandleCorners.current[1].x += dx;
      resizeHandleCorners.current[1].y += dy;
      // Bottom-right handle
      resizeHandleCorners.current[3].x += dx;
      break;
    case 2: // Bottom-left
      // Top-left handle
      resizeHandleCorners.current[0].x += dx;
      // Bottom-left handle
      resizeHandleCorners.current[2].x += dx;
      resizeHandleCorners.current[2].y += dy;
      // Bottom-right handle
      resizeHandleCorners.current[3].y += dy;
      break;
    case 3: // Bottom-right
      // Top-right handle
      resizeHandleCorners.current[1].x += dx;
      // Bottom-left handle
      resizeHandleCorners.current[2].y += dy;
      // Bottom-right handle
      resizeHandleCorners.current[3].x += dx;
      resizeHandleCorners.current[3].y += dy;
      break;
  }
}

export function setResizeHandleCorners(resizeHandleCorners, bounds) {
  resizeHandleCorners.current = [
    { x: bounds.minX, y: bounds.minY }, // Top-left
    { x: bounds.maxX, y: bounds.minY }, // Top-right
    { x: bounds.minX, y: bounds.maxY }, // Bottom-left
    { x: bounds.maxX, y: bounds.maxY }, // Bottom-right
  ];
}

export function getTrueBoundsFromResizeHandleCorners(resizeHandleCorners) {
  const xs = resizeHandleCorners.current.map((r) => r.x);
  const ys = resizeHandleCorners.current.map((r) => r.y);

  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
}

export function getPseudoBoundsFromResizeHandleCorners(resizeHandleCorners) {
  return {
    minX: resizeHandleCorners.current[0].x,
    maxX: resizeHandleCorners.current[1].x,
    minY: resizeHandleCorners.current[0].y,
    maxY: resizeHandleCorners.current[2].y,
  };
}

export function getScaledWidth(image, transform) {
  return image.width * transform[0];
}

export function getScaledHeight(image, transform) {
  return image.height * transform[3];
}

export function getImageBounds(image, transform) {
  const xs = [transform[4], transform[4] + getScaledWidth(image, transform)];
  const ys = [transform[5], transform[5] + getScaledHeight(image, transform)];

  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
}

export function getImageHandleBehaviorFn(
  resizeHandleIdx,
  xScaleWasPositive,
  yScaleWasPositive,
) {
  switch (resizeHandleIdx) {
    case 0:
      if (xScaleWasPositive && yScaleWasPositive) {
        return imageTopLeftHandleBehavior;
      } else if (xScaleWasPositive && !yScaleWasPositive) {
        return imageBottomLeftHandleBehavior;
      } else if (!xScaleWasPositive && yScaleWasPositive) {
        return imageTopRightHandleBehavior;
      } else if (!xScaleWasPositive && !yScaleWasPositive) {
        return imageBottomRightHandleBehavior;
      }
    case 1:
      if (xScaleWasPositive && yScaleWasPositive) {
        return imageTopRightHandleBehavior;
      } else if (xScaleWasPositive && !yScaleWasPositive) {
        return imageBottomRightHandleBehavior;
      } else if (!xScaleWasPositive && yScaleWasPositive) {
        return imageTopLeftHandleBehavior;
      } else if (!xScaleWasPositive && !yScaleWasPositive) {
        return imageBottomLeftHandleBehavior;
      }
    case 2:
      if (xScaleWasPositive && yScaleWasPositive) {
        return imageBottomLeftHandleBehavior;
      } else if (xScaleWasPositive && !yScaleWasPositive) {
        return imageTopLeftHandleBehavior;
      } else if (!xScaleWasPositive && yScaleWasPositive) {
        return imageBottomRightHandleBehavior;
      } else if (!xScaleWasPositive && !yScaleWasPositive) {
        return imageTopRightHandleBehavior;
      }
    case 3:
      if (xScaleWasPositive && yScaleWasPositive) {
        return imageBottomRightHandleBehavior;
      } else if (xScaleWasPositive && !yScaleWasPositive) {
        return imageTopRightHandleBehavior;
      } else if (!xScaleWasPositive && yScaleWasPositive) {
        return imageBottomLeftHandleBehavior;
      } else if (!xScaleWasPositive && !yScaleWasPositive) {
        return imageTopLeftHandleBehavior;
      }
  }
}

export function preventExactZero(scale) {
  if (scale === 0) {
    return 0.000001;
  }
  return scale;
}

function imageTopLeftHandleBehavior(
  transform,
  scaledWidth,
  scaledHeight,
  dx,
  dy,
  artifact,
) {
  transform[0] = preventExactZero((scaledWidth - dx) / artifact.value.width);
  transform[3] = preventExactZero((scaledHeight - dy) / artifact.value.height);
  transform[4] += dx;
  transform[5] += dy;
}

function imageTopRightHandleBehavior(
  transform,
  scaledWidth,
  scaledHeight,
  dx,
  dy,
  artifact,
) {
  transform[0] = preventExactZero((scaledWidth + dx) / artifact.value.width);
  transform[3] = preventExactZero((scaledHeight - dy) / artifact.value.height);
  transform[5] += dy;
}

function imageBottomLeftHandleBehavior(
  transform,
  scaledWidth,
  scaledHeight,
  dx,
  dy,
  artifact,
) {
  transform[0] = preventExactZero((scaledWidth - dx) / artifact.value.width);
  transform[3] = preventExactZero((scaledHeight + dy) / artifact.value.height);
  transform[4] += dx;
}

function imageBottomRightHandleBehavior(
  transform,
  scaledWidth,
  scaledHeight,
  dx,
  dy,
  artifact,
) {
  transform[0] = preventExactZero((scaledWidth + dx) / artifact.value.width);
  transform[3] = preventExactZero((scaledHeight + dy) / artifact.value.height);
}

export function detectHit(x, y, artifact, transform) {
  for (let i = 0; i < artifact.value.length; i++) {
    const stroke = artifact.value[i];
    const combinedTransform = getCombinedTransformForStroke(
      transform,
      stroke.transform,
    );

    if (isPointOnStroke(x, y, stroke, combinedTransform)) {
      return true;
    }
  }

  return false;
}
