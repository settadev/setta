import "forks/xyflow/controls/style.css";
import {
  resetZoom,
  zoomIn,
  zoomOut,
} from "forks/xyflow/core/hooks/useViewportHelper";
import { useReactFlow } from "forks/xyflow/core/store";
import {
  memo,
  useEffect,
  useState,
  type FC,
  type PropsWithChildren,
} from "react";
import { FaMinus, FaPlus } from "react-icons/fa6";
import { IoMapOutline } from "react-icons/io5";
import { TbArrowAutofitWidth, TbGridDots, TbZoomReset } from "react-icons/tb";
import { toggleMiniMap, toggleSnapToGrid } from "state/actions/localStorage";
import { useSettings } from "state/definitions";
import { localStorageFns } from "state/hooks/localStorage";
import { shallow } from "zustand/shallow";
import { onFitViewHandler } from "../core/store/utils";
import type { ControlProps } from "./types";

function useZoomReached() {
  const { minZoom, maxZoom } = useSettings(
    (x) => ({
      minZoom: x.gui.minZoom,
      maxZoom: x.gui.maxZoom,
    }),
    shallow,
  );
  return useReactFlow(
    (x) => ({
      minZoomReached: x.transform[2] <= minZoom,
      maxZoomReached: x.transform[2] >= maxZoom,
    }),
    shallow,
  );
}

const Controls: FC<PropsWithChildren<ControlProps>> = ({
  position = "bottom-left",
}) => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const { minZoomReached, maxZoomReached } = useZoomReached();
  const isInteractive = useReactFlow(
    (s) => s.nodesDraggable || s.elementsSelectable,
    shallow,
  );
  const fitViewOnInit = useReactFlow((x) => x.fitViewOnInit);
  const [snapToGrid] = localStorageFns.snapToGrid.hook();
  const [overviewWidth] = localStorageFns.overviewTrueWidth.hook();
  const [showMinimap] = localStorageFns.showMinimap.hook();
  const styleForActive = " dark:!text-blue-600 !text-white";

  useEffect(() => {
    setIsVisible(true);
  }, []);

  if (!isVisible) {
    return null;
  }

  const onZoomInHandler = () => {
    zoomIn();
  };

  const onZoomOutHandler = () => {
    zoomOut();
  };

  return (
    <div
      className="mb-10 mt-auto flex w-8 flex-col items-center gap-1 overflow-hidden rounded-md border px-0.5 pb-2 pt-1.5 dark:border-setta-800"
      data-testid="rf__controls"
    >
      <button
        onClick={onZoomInHandler}
        className="react-flow__controls-zoomin focus-visible:ring-light-blue-500 cursor-pointer items-center justify-center overflow-clip rounded-md p-1 text-setta-400 hover:text-setta-600 focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-2 dark:text-setta-600 dark:hover:text-setta-500"
        title="zoom in"
        aria-label="zoom in"
        disabled={maxZoomReached}
      >
        <FaPlus size={15} />
      </button>
      <button
        onClick={onZoomOutHandler}
        className="react-flow__controls-zoomout focus-visible:ring-light-blue-500 cursor-pointer items-center justify-center overflow-clip rounded-md p-1 text-setta-400 hover:text-setta-600 focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-2 dark:text-setta-600 dark:hover:text-setta-500"
        title="zoom out"
        aria-label="zoom out"
        disabled={minZoomReached}
      >
        <FaMinus size={15} />
      </button>
      <button
        className={`react-flow__controls-fitview focus-visible:ring-light-blue-500 cursor-pointer items-center justify-center rounded-md p-1 text-setta-400 hover:text-setta-600 focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-2 dark:text-setta-600 dark:hover:text-setta-500  overflow-clip${fitViewOnInit ? styleForActive : ""}`}
        onClick={onFitViewHandler}
        title="fit view"
        aria-label="fit view"
      >
        <TbArrowAutofitWidth size={15} />
      </button>
      {/* {showInteractive && (
        <button
          className="react-flow__controls-interactive"
          onClick={onToggleInteractivity}
          title="toggle interactivity"
          aria-label="toggle interactivity"
        >
          {isInteractive ? <UnlockIcon /> : <LockIcon />}
        </button>
      )} */}
      {/* <button onClick={autoLayout}>
        <RiLayoutFill />
      </button> */}
      <button
        onClick={toggleSnapToGrid}
        className={`focus-visible:ring-light-blue-500 cursor-pointer items-center justify-center rounded-md p-1 text-setta-400 hover:text-setta-600 focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-2 dark:text-setta-600  dark:hover:text-setta-500 overflow-clip${snapToGrid ? styleForActive : ""}`}
      >
        <TbGridDots size={15} />
      </button>
      <button
        className="react-flow__controls-button focus-visible:ring-light-blue-500 cursor-pointer items-center justify-center overflow-clip rounded-md p-1 text-setta-400 hover:text-setta-600 focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-2 dark:text-setta-600 dark:hover:text-setta-500"
        onClick={resetZoom}
      >
        <TbZoomReset size={15} />
      </button>
      <button
        onClick={toggleMiniMap}
        className={`focus-visible:ring-light-blue-500 cursor-pointer items-center justify-center overflow-clip rounded-md p-1 text-setta-400 hover:text-setta-600 focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-2 dark:text-setta-600 dark:hover:text-setta-500 ${showMinimap ? styleForActive : ""}`}
      >
        <IoMapOutline size={15} />
      </button>
    </div>
  );
};

Controls.displayName = "Controls";

export default memo(Controls);
