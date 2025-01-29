/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Selection as D3Selection } from "d3";
import {
  useActiveSection,
  useSectionInfos,
  useSectionRefs,
} from "state/definitions";
import { localStorageFns } from "state/hooks/localStorage";
import { clamp } from "utils/utils";
import { screenToFlowPosition } from "../hooks/useViewportHelper";
import { useReactFlow } from "../store";
import { Node, Rect, Transform, Viewport, XYPosition } from "../types";
import {
  boxToRect,
  getBoundsOfBoxes,
  getOverlappingArea,
  rectToBox,
} from "../utils";

export const pointToRendererPoint = (
  { x, y }: XYPosition,
  [tx, ty, tScale]: Transform,
  snapToGrid: boolean,
  [snapX, snapY]: [number, number],
  ignoreGrid,
): XYPosition => {
  const position: XYPosition = {
    x: (x - tx) / tScale,
    y: (y - ty) / tScale,
  };

  if (!ignoreGrid && snapToGrid) {
    return {
      x: snapX * Math.round(position.x / snapX),
      y: snapY * Math.round(position.y / snapY),
    };
  }

  return position;
};

export const rendererPointToPoint = (
  { x, y }: XYPosition,
  [tx, ty, tScale]: Transform,
): XYPosition => {
  return {
    x: x * tScale + tx,
    y: y * tScale + ty,
  };
};

export const getNodesBounds = (nodes: Node[]): Rect => {
  if (nodes.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  const box = nodes.reduce(
    (currBox, node) => {
      const { x, y } = node.position;
      return getBoundsOfBoxes(
        currBox,
        rectToBox({
          x,
          y,
          width: node.width || 0,
          height: node.height || 0,
        }),
      );
    },
    { x: Infinity, y: Infinity, x2: -Infinity, y2: -Infinity },
  );

  return boxToRect(box);
};

export function getActiveSectionsBounds(ignoreGrid = false) {
  const activeSectionIds = useActiveSection.getState().ids;
  const sections = activeSectionIds.map((sectionId) => {
    const { x, y, width, height } = getSectionRect(sectionId, ignoreGrid);
    return { position: { x, y }, width, height };
  });

  return getNodesBounds(sections);
}

export function getNodesInside(
  rect,
  [tx, ty, tScale] = [0, 0, 1],
  partially = false,
  // set excludeNonSelectableNodes if you want to pay attention to the nodes "selectable" attribute
  excludeNonSelectableNodes = false,
) {
  const rectToLookInside = {
    x: (rect.x - tx) / tScale,
    y: (rect.y - ty) / tScale,
    width: rect.width / tScale,
    height: rect.height / tScale,
  };

  const visibleNodes = [];

  for (const section of Object.values(useSectionInfos.getState().x)) {
    const isVisible = isSectionOverlappingWithRect(
      section.id,
      rectToLookInside,
      partially,
    );

    if (isVisible) {
      visibleNodes.push(section.id);
    }
  }

  return visibleNodes;
}

export const getViewportForBounds = (
  bounds: Rect,
  width: number,
  height: number,
  minZoom: number,
  maxZoom: number,
  padding = 0.1,
  keepCurrZoomIfPossible = false,
): Viewport => {
  const xZoom = width / (bounds.width * (1 + padding));
  const yZoom = height / (bounds.height * (1 + padding));
  const unclampedZoom = Math.min(xZoom, yZoom);
  const clampedZoom = clamp(unclampedZoom, minZoom, maxZoom);
  const boundsCenterX = bounds.x + bounds.width / 2;
  const boundsCenterY = bounds.y + bounds.height / 2;

  let zoom = clampedZoom;
  if (keepCurrZoomIfPossible) {
    const currZoom = useReactFlow.getState().transform[2];
    // if we have to zoom out to view the whole bounds
    // or if we have to zoom in to reach a "reasonable" zoom level
    zoom =
      unclampedZoom < currZoom || clampedZoom > currZoom
        ? clampedZoom
        : currZoom;
  }

  const x =
    width / 2 -
    boundsCenterX * zoom +
    localStorageFns.overviewTrueWidth.state()[0];
  const y = height / 2 - boundsCenterY * zoom;

  return { x, y, zoom };
};

export const getD3Transition = (
  selection: D3Selection<Element, unknown, null, undefined>,
  duration = 0,
) => {
  return selection.transition().duration(duration);
};

export function getSectionRect(sectionId, ignoreGrid = false) {
  const ref =
    useSectionRefs.getState().selfOnly[sectionId] ??
    useSectionRefs.getState().withNested[sectionId];
  if (!ref) {
    return null;
  }

  const { clientWidth: width, clientHeight: height } = ref;
  const { x: _x, y: _y } = ref.getBoundingClientRect();
  const { x, y } = screenToFlowPosition(
    {
      x: _x,
      y: _y,
    },
    ignoreGrid,
  );
  return { x, y, width, height };
}

export function getSectionRectWithNested(sectionId) {
  const ref = useSectionRefs.getState().withNested[sectionId];
  const { clientWidth: width, clientHeight: height } = ref;
  return { width, height };
}

export function getPaneRect(s, overviewWidth) {
  return {
    x: (-s.transform[0] + overviewWidth) / s.transform[2],
    y: -s.transform[1] / s.transform[2],
    width: s.width / s.transform[2],
    height: s.height / s.transform[2],
  };
}

export function isSectionFullyVisible(id) {
  const paneRect = getPaneRect(
    useReactFlow.getState(),
    localStorageFns.overviewTrueWidth.state()[0],
  );

  return isSectionOverlappingWithRect(id, paneRect, false);
}

function isSectionOverlappingWithRect(sectionId, otherRect, partially) {
  const rect = getSectionRect(sectionId);
  if (!rect) {
    return false;
  }

  const { x, y, width, height } = rect;

  const nodeRect = {
    x,
    y,
    width: width || 0,
    height: height || 0,
  };
  const overlappingArea = getOverlappingArea(otherRect, nodeRect);
  const notInitialized =
    typeof width === "undefined" ||
    typeof height === "undefined" ||
    width === null ||
    height === null;

  const partiallyVisible = partially && overlappingArea > 0;
  const area = (width || 0) * (height || 0);
  return notInitialized || partiallyVisible || overlappingArea >= area;
}

export function movePaneToIncludeElement(element) {
  const point = screenToFlowPosition(element.getBoundingClientRect());
  const paneRect = getPaneRect(
    useReactFlow.getState(),
    localStorageFns.overviewTrueWidth.state()[0],
  );
  const { x, y, isInside } = getRectTranslation(point, paneRect, 100);
  if (!isInside) {
    const { d3Zoom, d3Selection } = useReactFlow.getState();
    d3Zoom.translateBy(d3Selection, -x, -y);
  }
}

function getRectTranslation(point, rect, padding = 0) {
  // Calculate the boundaries with padding
  const minX = rect.x + padding;
  const maxX = rect.x + rect.width - padding;
  const minY = rect.y + padding;
  const maxY = rect.y + rect.height - padding;

  let translateX = 0;
  let translateY = 0;

  // Calculate required X translation
  if (point.x < minX) {
    translateX = point.x - minX; // negative: move rectangle left
  } else if (point.x > maxX) {
    translateX = point.x - maxX; // positive: move rectangle right
  }

  // Calculate required Y translation
  if (point.y < minY) {
    translateY = point.y - minY; // negative: move rectangle up
  } else if (point.y > maxY) {
    translateY = point.y - maxY; // positive: move rectangle down
  }

  return {
    x: translateX,
    y: translateY,
    isInside: translateX === 0 && translateY === 0,
  };
}
