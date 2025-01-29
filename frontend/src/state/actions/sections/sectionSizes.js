import _ from "lodash";
import {
  getHighestAncestor,
  getSectionDescendants,
} from "state/actions/sectionInfos";

export function setSelfParentSiblingChildrenWidths(
  sectionId,
  changedSize,
  state,
) {
  // set own size
  setSectionSize(sectionId, changedSize, state);

  if (!_.isNil(changedSize.width)) {
    setAllOtherWidths(sectionId, changedSize.width, state);
  }
}

function setAllOtherWidths(sectionId, width, state) {
  // We want to stop width propagation as soon as we hit a horizontal group.
  const parentIdGetter = (id) => {
    const { parentId } = state.x[id];
    if (parentId && !state.x[parentId].isHorizontalOrientation) {
      return parentId;
    }
    return null;
  };
  const highestAncestor = getHighestAncestor(sectionId, parentIdGetter);
  setAllChildrenWidths({
    sectionId: highestAncestor,
    exclude: sectionId,
    width,
    state,
  });
}

export function setAllChildrenWidths({ sectionId, exclude, width, state }) {
  const sectionIds = getSectionDescendants(sectionId, state);
  for (const s of sectionIds) {
    if (s === exclude) {
      continue;
    }
    setSectionSize(s, { width }, state);
  }
}

export function adjustSizeToBeAtLeastMin(height, width, minHeight, minWidth) {
  const aspectRatio = width / height;

  if (height < minHeight || width < minWidth) {
    if (height < minHeight) {
      height = minHeight;
      width = height * aspectRatio;
    }

    if (width < minWidth) {
      width = minWidth;
      height = width / aspectRatio;
    }

    // Round the dimensions to avoid floating-point issues
    return {
      height: Math.round(height),
      width: Math.round(width),
    };
  }

  // If no adjustment is needed, return the original dimensions
  return { height, width };
}

export function adjustAspectRatio(height, width, imgHeight, imgWidth) {
  // If both height and width are "auto", return original image dimensions
  if (height === "auto" && width === "auto") {
    return { height: imgHeight, width: imgWidth };
  }

  // Calculate the aspect ratio of the original image
  const imgAspectRatio = imgWidth / imgHeight;

  // If height is "auto", adjust height based on width
  if (height === "auto") {
    const newHeight = width / imgAspectRatio;
    return { height: newHeight, width: width };
  }

  // If width is "auto", adjust width based on height
  if (width === "auto") {
    const newWidth = height * imgAspectRatio;
    return { height: height, width: newWidth };
  }

  // Calculate the current aspect ratio
  const currentAspectRatio = width / height;

  // Adjust dimensions to maintain the original aspect ratio
  if (currentAspectRatio > imgAspectRatio) {
    // Adjust width based on height
    const newWidth = height * imgAspectRatio;
    return { height: height, width: newWidth };
  } else if (currentAspectRatio < imgAspectRatio) {
    // Adjust height based on width
    const newHeight = width / imgAspectRatio;
    return { height: newHeight, width: width };
  } else {
    // Aspect ratios match, return the provided dimensions
    return { height: height, width: width };
  }
}

export function setSectionSize(sectionId, size, state) {
  state.x[sectionId].size = { ...state.x[sectionId].size, ...size };
}
