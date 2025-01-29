import { useEffect } from "react";
import { useSettings } from "state/definitions";
import { screenToFlowPosition, setCenter } from "../hooks/useViewportHelper";

let mouseLocation;

function addMouseLocationListener() {
  function handleMouseMove(e) {
    mouseLocation = {
      x: e.clientX,
      y: e.clientY,
    };
  }

  window.addEventListener("mousemove", handleMouseMove);
  return () => window.removeEventListener("mousemove", handleMouseMove);
}

export function useAddMouseLocationListener() {
  useEffect(() => {
    return addMouseLocationListener();
  }, []);
}

export function zoomToMouseLocation() {
  const { x, y } = screenToFlowPosition(mouseLocation);
  const { defaultZoomLevel: zoom, transitionDuration: duration } =
    useSettings.getState().gui;
  setCenter(x, y, { zoom, duration });
}
