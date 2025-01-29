export function getTransformedPoints(points, transform) {
  if (!transform) {
    return points;
  }
  return points.map((point) => [
    point[0] * transform[0] + transform[4],
    point[1] * transform[3] + transform[5],
  ]);
}

function getSegmentAngle(p1, p2) {
  return Math.atan2(p2[1] - p1[1], p2[0] - p1[0]);
}

function getTransformedWidth(width, angle, scaleX, scaleY) {
  // Get the direction perpendicular to the line
  const perpAngle = angle + Math.PI / 2;

  // Calculate how much the width is scaled in the perpendicular direction
  const perpX = Math.cos(perpAngle);
  const perpY = Math.sin(perpAngle);

  // Scale the perpendicular vector
  const scaledPerpX = perpX * scaleX;
  const scaledPerpY = perpY * scaleY;

  // The new width is the length of the scaled perpendicular vector
  return (
    width * Math.sqrt(scaledPerpX * scaledPerpX + scaledPerpY * scaledPerpY)
  );
}

function getSamplePoints(points, minDistance) {
  if (points.length <= 2) return points;

  const samples = [points[0]];
  let lastSample = points[0];

  for (let i = 1; i < points.length; i++) {
    const point = points[i];
    const dx = point[0] - lastSample[0];
    const dy = point[1] - lastSample[1];
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance >= minDistance) {
      samples.push(point);
      lastSample = point;
    }
  }

  // Always include the last point if it's not too close to the last sample
  const lastPoint = points[points.length - 1];
  const dx = lastPoint[0] - lastSample[0];
  const dy = lastPoint[1] - lastSample[1];
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance >= minDistance || samples.length === 1) {
    samples.push(lastPoint);
  }

  return samples;
}

export function isPointOnStroke(x, y, stroke, transform) {
  const point = [x, y];
  const allPoints = getTransformedPoints(stroke.points, transform);
  const strokePoints = getSamplePoints(allPoints, 5);

  // Handle single point
  if (strokePoints.length === 1) {
    const width = stroke.lineWidth * Math.max(transform[0], transform[3]);
    return (
      Math.hypot(
        point[0] - strokePoints[0][0],
        point[1] - strokePoints[0][1],
      ) <=
      width / 2
    );
  }

  // Check each segment between sampled points
  for (let i = 0; i < strokePoints.length - 1; i++) {
    const currentPoint = strokePoints[i];
    const nextPoint = strokePoints[i + 1];

    const segmentAngle = getSegmentAngle(currentPoint, nextPoint);
    const segmentWidth = getTransformedWidth(
      stroke.lineWidth,
      segmentAngle,
      transform[0],
      transform[3],
    );

    // Calculate distance to line segment
    const dx = nextPoint[0] - currentPoint[0];
    const dy = nextPoint[1] - currentPoint[1];
    const lengthSq = dx * dx + dy * dy;

    if (lengthSq === 0) continue;

    const t = Math.max(
      0,
      Math.min(
        1,
        ((point[0] - currentPoint[0]) * dx +
          (point[1] - currentPoint[1]) * dy) /
          lengthSq,
      ),
    );

    const projX = currentPoint[0] + t * dx;
    const projY = currentPoint[1] + t * dy;
    const distance = Math.hypot(point[0] - projX, point[1] - projY);

    if (distance <= segmentWidth / 2) {
      return true;
    }
  }

  return false;
}
