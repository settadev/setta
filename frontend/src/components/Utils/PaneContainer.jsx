import { Resizable } from "re-resizable";
import { useEffect, useState } from "react";
import { localStorageFns } from "state/hooks/localStorage";
import { useWindowSize } from "state/hooks/utils";
import { CLOSED_PANE_WIDTH } from "utils/constants";
import { clamp } from "utils/utils";

export function PaneContainer({
  onResizeStop = null,
  paneName,
  right,
  children,
  minimumWidth,
  vis,
  width,
}) {
  const size = useWindowSize();
  const [vMax, setVMax] = useState(100000);
  const [vMin, setVMin] = useState(minimumWidth);

  function setNewWidth(newWidth) {
    localStorageFns[`${paneName}Width`].state()[1](newWidth);
    localStorageFns[`${paneName}TrueWidth`].state()[1](
      vis ? newWidth : CLOSED_PANE_WIDTH,
    );
  }

  useEffect(() => {
    const newVMax = size.winWidth / 2.1;
    const newVMin = Math.min(minimumWidth, newVMax);
    newVMax && setVMax(newVMax);
    newVMin && setVMin(newVMin);
    if (width > newVMax) {
      setNewWidth(newVMax);
    } else if (width < newVMin) {
      setNewWidth(newVMin);
    }
  }, [vis, size.winWidth]);

  function localOnResizeStop(e, direction, ref, d) {
    const newWidth = clamp(width + d.width, vMin, vMax);
    if (newWidth === width) {
      return;
    }
    setNewWidth(newWidth);
    if (onResizeStop) {
      onResizeStop(d.width);
    }
  }

  const style = `${!right ? "-" : ""}${width - CLOSED_PANE_WIDTH}px`;

  const rightCondition = right
    ? "justify-self-end left-auto border-l pr-10 place-items-center"
    : "justify-self-start right-auto border-r pl-10 place-items-center";

  // flex flex-grow flex-col

  return (
    <Resizable
      size={{ width, height: "100%" }}
      as="aside"
      onResizeStop={localOnResizeStop}
      maxWidth={vMax}
      minWidth={vMin}
      enable={{
        top: false,
        right: vis && !right,
        bottom: false,
        left: vis && right,
        topRight: false,
        bottomRight: false,
        bottomLeft: false,
        topLeft: false,
      }}
      className={`single-cell-container z-10 col-start-1 col-end-2 row-start-2 row-end-3  min-h-0 min-w-0 border-setta-200 bg-setta-50 py-5 shadow-md transition-transform dark:border-setta-800 dark:bg-setta-900 ${rightCondition} overflow-clip`}
      style={{ transform: `translateX(${vis ? "0" : style})` }}
    >
      {children}
    </Resizable>
  );
}
