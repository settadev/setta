export function computeNewIndex(activeIdx, overIdx, pastHalfway, maxIdx) {
  // Handle special case when activeIdx is 0
  if (activeIdx === 0) {
    if (overIdx === 0) {
      return 0;
    } else if (pastHalfway) {
      return overIdx;
    } else {
      return Math.max(0, overIdx - 1);
    }
  }

  // Handle special case when activeIdx is maxIdx
  if (activeIdx === maxIdx) {
    if (overIdx === maxIdx) {
      return maxIdx;
    } else if (pastHalfway) {
      return Math.min(maxIdx, overIdx + 1);
    } else {
      return overIdx;
    }
  }

  // Handle general case
  if (overIdx < activeIdx) {
    return pastHalfway ? Math.min(activeIdx, overIdx + 1) : overIdx;
  } else if (overIdx > activeIdx) {
    return pastHalfway ? overIdx : Math.max(activeIdx, overIdx - 1);
  } else {
    return activeIdx;
  }
}
