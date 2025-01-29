function addPaddingToBounds(bounds, padding) {
  return {
    minX: bounds.minX - padding,
    maxX: bounds.maxX + padding,
    minY: bounds.minY - padding,
    maxY: bounds.maxY + padding,
  };
}

function isPointInBounds(point, bounds) {
  return (
    point[0] >= bounds.minX &&
    point[0] <= bounds.maxX &&
    point[1] >= bounds.minY &&
    point[1] <= bounds.maxY
  );
}

function calculateCapPoint(point, referencePoint, halfWidth, capExtra) {
  const angle = Math.atan2(
    point[1] - referencePoint[1],
    point[0] - referencePoint[0],
  );
  return [
    point[0] + (halfWidth + capExtra) * Math.cos(angle),
    point[1] + (halfWidth + capExtra) * Math.sin(angle),
  ];
}

function isPointInBoundsWithLineCap(
  point,
  prevPoint,
  nextPoint,
  bounds,
  lineCap,
  halfWidth,
) {
  // Basic bounds check
  if (isPointInBounds(point, bounds)) {
    return true;
  }

  // For 'butt' cap, no additional checks needed
  if (lineCap === "butt") {
    return false;
  }

  // For 'round' or 'square' caps, check additional area
  const capExtra = lineCap === "square" ? halfWidth : 0;

  // If this is the start point and we have a next point
  if (!prevPoint && nextPoint) {
    const [capX, capY] = calculateCapPoint(
      nextPoint,
      point,
      halfWidth,
      capExtra,
    );
    return isPointInBounds([capX, capY], bounds);
  }

  // If this is the end point and we have a previous point
  if (!nextPoint && prevPoint) {
    const [capX, capY] = calculateCapPoint(
      point,
      prevPoint,
      halfWidth,
      capExtra,
    );
    return isPointInBounds([capX, capY], bounds);
  }

  return false;
}

function filterPointsWithBounds(pathPoints, bounds, lineCap, lineWidth) {
  if (!pathPoints || pathPoints.length === 0) {
    return [];
  }

  const halfWidth = lineWidth / 2;
  const result = [];
  let includeNext = false;

  for (let i = 0; i < pathPoints.length; i++) {
    const point = pathPoints[i];
    const prevPoint = i > 0 ? pathPoints[i - 1] : null;
    const nextPoint = i < pathPoints.length - 1 ? pathPoints[i + 1] : null;

    const isInBounds = isPointInBoundsWithLineCap(
      point,
      prevPoint,
      nextPoint,
      bounds,
      lineCap,
      halfWidth,
    );

    if (isInBounds) {
      if (i > 0 && result.length === 0) {
        // Include the previous point when entering bounds
        result.push(pathPoints[i - 1]);
      }
      result.push(point);
      includeNext = true;
    } else if (includeNext) {
      // Include one point after exiting bounds
      result.push(point);
      includeNext = false;
    }
  }

  return result;
}

export function filterEraserPath(pathPoints, lineWidth, lineCap, imageBounds) {
  if (!pathPoints || pathPoints.length === 0) {
    return [];
  }

  const halfWidth = lineWidth / 2;
  const paddedImagedBounds = addPaddingToBounds(imageBounds, halfWidth);

  return filterPointsWithBounds(
    pathPoints,
    paddedImagedBounds,
    lineCap,
    lineWidth,
  );
}
