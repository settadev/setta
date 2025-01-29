import { getWindow, useIsomorphicLayoutEffect } from "@dnd-kit/utilities";
import { useReducer } from "react";

import type { ClientRect } from "../../types";
import { isDocumentScrollingElement } from "../../utilities";
import { getClientRect, Rect } from "../../utilities/rect";

import { useResizeObserver } from "./useResizeObserver";
import { useWindowRect } from "./useWindowRect";

const defaultValue: Rect[] = [];

export function useRects(
  elements: Element[],
  measure: (element: Element) => ClientRect = getClientRect,
): ClientRect[] {
  const [firstElement] = elements;
  const windowRect = useWindowRect(
    firstElement ? getWindow(firstElement) : null,
  );
  const [rects, measureRects] = useReducer(reducer, defaultValue);
  const resizeObserver = useResizeObserver({ callback: measureRects });

  if (elements.length > 0 && rects === defaultValue) {
    measureRects();
  }

  useIsomorphicLayoutEffect(() => {
    if (elements.length) {
      elements.forEach((element) => resizeObserver?.observe(element));
    } else {
      resizeObserver?.disconnect();
      measureRects();
    }
  }, [elements]);

  return rects;

  function reducer() {
    if (!elements.length) {
      return defaultValue;
    }

    return elements.map((element) =>
      isDocumentScrollingElement(element)
        ? (windowRect as ClientRect)
        : new Rect(measure(element), element),
    );
  }
}
