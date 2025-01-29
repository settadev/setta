export const SIZE_MODE = {
  any: "any",
  auto_only: "auto_only",
  manual_only: "manual_only",
};

function parseCurrPx(x) {
  return x === "auto" ? x : parseInt(x);
}

function maybeAutoPx(autoDim, pxDim, sizeMode) {
  return sizeMode !== SIZE_MODE.manual_only ? autoDim : pxDim;
}

function getDoubleClickSize({ direction, ref, sizeMode, aspectRatio }) {
  // width returns minWidth instead of auto because
  // it seems like once width is resized, auto does nothing
  const pxWidth = parseCurrPx(ref.style.width);
  const pxHeight = parseCurrPx(ref.style.height);
  const autoWidth = maybeAutoPx("auto", pxWidth, sizeMode.width);
  const autoHeight = maybeAutoPx("auto", pxHeight, sizeMode.height);

  if (direction === "bottomRight") {
    return {
      width: autoWidth,
      height: autoHeight,
    };
  }
  if (direction === "right" && sizeMode.width) {
    return aspectRatio
      ? { width: autoWidth, height: autoHeight }
      : { width: autoWidth };
  }
  if (direction === "bottom" && sizeMode.height) {
    return aspectRatio
      ? { width: autoWidth, height: autoHeight }
      : { height: autoHeight };
  }
  return {};
}

function getSingleClickSize({ direction, ref, sizeMode, aspectRatio }) {
  // width returns minWidth instead of auto because
  // it seems like once width is resized, auto does nothing
  const pxWidth = parseCurrPx(ref.style.width);
  const pxHeight = parseCurrPx(ref.style.height);

  if (direction === "bottomRight") {
    return {
      width: pxWidth,
      height: pxHeight,
    };
  }
  if (direction === "right" && sizeMode.width) {
    // if aspectRatio is specified, we want to update both width and height
    return aspectRatio
      ? { width: pxWidth, height: pxHeight }
      : { width: pxWidth };
  }
  if (direction === "bottom" && sizeMode.height) {
    // if aspectRatio is specified, we want to update both width and height
    return aspectRatio
      ? { width: pxWidth, height: pxHeight }
      : { height: pxHeight };
  }
  return {};
}

export function getChangedSize({ props, sizeMode, aspectRatio }) {
  const [e, direction, ref, d] = props;
  if (d.width === 0 && d.height === 0 && e.detail === 2) {
    return getDoubleClickSize({
      direction,
      ref,
      sizeMode,
      aspectRatio,
    });
  } else {
    return getSingleClickSize({ direction, ref, sizeMode, aspectRatio });
  }
}
