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
import { IoMapOutline } from "react-icons/io5";
import { TbGrid4X4, TbZoomReset } from "react-icons/tb";
import { toggleMiniMap, toggleSnapToGrid } from "state/actions/localStorage";
import { useSettings } from "state/definitions";
import { localStorageFns } from "state/hooks/localStorage";
import { shallow } from "zustand/shallow";
import Panel from "../core/components/Panel";
import { onFitViewHandler } from "../core/store/utils";
import ControlButton from "./ControlButton";
import FitviewIcon from "./Icons/FitView";
import MinusIcon from "./Icons/Minus";
import PlusIcon from "./Icons/Plus";
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
  const styleForActive = "!bg-blue-500 dark:!bg-blue-700 !text-white";

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

  // const onToggleInteractivity = () => {
  //   useReactFlow.setState({
  //     nodesDraggable: !isInteractive,
  //     elementsSelectable: !isInteractive,
  //   });

  //   onInteractiveChange?.(!isInteractive);
  // };

  // bg-setta-50 hover:bg-setta-200 dark:border-setta-800 dark:bg-setta-700 dark:text-setta-300 dark:hover:bg-setta-800 dark:[&_svg]:fill-setta-300

  return (
    <Panel
      className="react-flow__controls overflow-hidden rounded-md border border-solid border-setta-800/10 shadow-lg transition-transform dark:border-setta-300/30"
      position={position}
      style={{ transform: `translateX(${overviewWidth}px)` }}
      data-testid="rf__controls"
    >
      <ControlButton
        onClick={onZoomInHandler}
        className="react-flow__controls-zoomin bg-setta-50 hover:bg-setta-200 dark:border-setta-800 dark:bg-setta-700 dark:text-setta-300 dark:hover:bg-setta-800 dark:[&_svg]:fill-setta-300"
        title="zoom in"
        aria-label="zoom in"
        disabled={maxZoomReached}
      >
        <PlusIcon />
      </ControlButton>
      <ControlButton
        onClick={onZoomOutHandler}
        className="react-flow__controls-zoomout bg-setta-50 hover:bg-setta-200 dark:border-setta-800 dark:bg-setta-700 dark:text-setta-300 dark:hover:bg-setta-800 dark:[&_svg]:fill-setta-300"
        title="zoom out"
        aria-label="zoom out"
        disabled={minZoomReached}
      >
        <MinusIcon />
      </ControlButton>
      <ControlButton
        className={`react-flow__controls-fitview hover:bg-setta-200 dark:border-setta-800  dark:text-setta-300 dark:hover:bg-setta-800 dark:[&_svg]:fill-setta-300 ${fitViewOnInit ? styleForActive : "bg-setta-50 dark:bg-setta-700"}`}
        onClick={onFitViewHandler}
        title="fit view"
        aria-label="fit view"
      >
        <FitviewIcon />
      </ControlButton>
      {/* {showInteractive && (
        <ControlButton
          className="react-flow__controls-interactive"
          onClick={onToggleInteractivity}
          title="toggle interactivity"
          aria-label="toggle interactivity"
        >
          {isInteractive ? <UnlockIcon /> : <LockIcon />}
        </ControlButton>
      )} */}
      {/* <ControlButton onClick={autoLayout}>
        <RiLayoutFill />
      </ControlButton> */}
      <ControlButton
        onClick={toggleSnapToGrid}
        className={`hover:bg-setta-200 dark:border-setta-800  dark:text-setta-300 dark:hover:bg-setta-800 dark:[&_svg]:fill-setta-300 ${snapToGrid ? styleForActive : "bg-setta-50 dark:bg-setta-700"}`}
      >
        <TbGrid4X4 />
      </ControlButton>
      <ControlButton
        className="react-flow__controls-button dark: bg-setta-50  hover:bg-setta-200 dark:border-setta-800 dark:bg-setta-700 dark:text-setta-300 dark:hover:bg-setta-800"
        onClick={resetZoom}
      >
        <TbZoomReset />
      </ControlButton>
      <ControlButton
        onClick={toggleMiniMap}
        className={`hover:bg-setta-200 dark:border-setta-800  dark:text-setta-300 dark:hover:bg-setta-800 dark:[&_svg]:fill-setta-300 ${showMinimap ? styleForActive : "bg-setta-50 dark:bg-setta-700"}`}
      >
        <IoMapOutline />
      </ControlButton>
    </Panel>
  );
};

Controls.displayName = "Controls";

export default memo(Controls);
