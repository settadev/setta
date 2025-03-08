import _ from "lodash";
import { useEffect } from "react";
import { setSelfParentSiblingChildrenWidths } from "state/actions/sections/sectionSizes";
import { maybeIncrementProjectStateVersion } from "state/actions/undo";
import { useMisc, useSectionInfos, useSettings } from "state/definitions";
import { useShouldDisablePointerEvents } from "state/hooks/keyActivations";
import { localStorageFns } from "state/hooks/localStorage";
import { useSectionMinMaxDims } from "state/hooks/sectionSizes";
import {
  NO_PAN_CLASS_NAME,
  SETTA_PREVENT_SECTION_ACTIVE_CSS,
  SETTA_PREVENT_SECTION_ON_CLICK_TRIGGER,
} from "utils/constants";
import { ResizableWithScale } from "./ResizableWithScale";
import { getChangedSize, SIZE_MODE } from "./utils";

export function CustomResizable({
  sectionId,
  bgColor,
  isYouTube,
  isActiveSection,
  positionAndSizeLocked,
  children,
  as,
}) {
  const { minHeight, maxHeight, minWidth, maxWidth, sizeMode } =
    useSectionMinMaxDims(sectionId);
  return (
    <CustomResizableCore
      sectionId={sectionId}
      bgColor={bgColor}
      isYouTube={isYouTube}
      isActiveSection={isActiveSection}
      positionAndSizeLocked={positionAndSizeLocked}
      minHeight={minHeight}
      maxHeight={maxHeight}
      minWidth={minWidth}
      maxWidth={maxWidth}
      sizeMode={sizeMode}
      as={as}
    >
      {children}
    </CustomResizableCore>
  );
}

function CustomResizableCore({
  sectionId,
  bgColor,
  isYouTube,
  isActiveSection,
  positionAndSizeLocked,
  minHeight,
  maxHeight,
  minWidth,
  maxWidth,
  sizeMode,
  children,
  as,
}) {
  useEffect(() => {
    const changedSize = {};
    if (sizeMode.height === SIZE_MODE.auto_only) {
      changedSize.height = "auto";
    }
    if (sizeMode.width === SIZE_MODE.auto_only) {
      changedSize.width = "auto";
    }
    if (_.size(changedSize) > 0) {
      useSectionInfos.setState((state) => {
        setSelfParentSiblingChildrenWidths(sectionId, changedSize, state);
      });
    }
  }, [sizeMode.height, sizeMode.width]);

  const { size, aspectRatio, aspectRatioExtraHeight, aspectRatioExtraWidth } =
    useAspectRatio(sectionId);

  function onResizeStart() {
    useSectionInfos.setState((state) => {
      setSectionResizeEvent(sectionId, "start", state);
    });
    useMisc.setState({ mouseDownDraggingSection: true });
  }

  function onResizeStop(...props) {
    const changedSize = getChangedSize({
      props,
      sizeMode,
      aspectRatio,
    });
    useSectionInfos.setState((state) => {
      setSelfParentSiblingChildrenWidths(sectionId, changedSize, state);
      setSectionResizeEvent(sectionId, "end", state);
    });
    useMisc.setState({ mouseDownDraggingSection: false });
    maybeIncrementProjectStateVersion(true);
  }

  const heightResizable =
    minHeight !== maxHeight && sizeMode.height !== SIZE_MODE.auto_only;
  const widthResizable = sizeMode.width !== SIZE_MODE.auto_only;

  const snapGrid = useSettings((x) => x.gui.snapGrid);
  const snapToGrid = localStorageFns.snapToGrid.hook()[0];

  return (
    <CustomResizableSuperCore
      sectionId={sectionId}
      as={as}
      bgColor={bgColor}
      isYouTube={isYouTube}
      isActiveSection={isActiveSection}
      size={size}
      minHeight={minHeight}
      maxHeight={maxHeight}
      minWidth={minWidth}
      maxWidth={maxWidth}
      heightResizable={heightResizable}
      widthResizable={widthResizable}
      positionAndSizeLocked={positionAndSizeLocked}
      onResizeStart={onResizeStart}
      onResizeStop={onResizeStop}
      aspectRatio={aspectRatio}
      aspectRatioExtraHeight={aspectRatioExtraHeight}
      aspectRatioExtraWidth={aspectRatioExtraWidth}
      snapGrid={snapGrid}
      snapToGrid={snapToGrid}
    >
      {children}
    </CustomResizableSuperCore>
  );
}

function CustomResizableSuperCore({
  sectionId,
  as,
  bgColor,
  isYouTube,
  isActiveSection,
  size,
  minHeight,
  maxHeight,
  minWidth,
  maxWidth,
  heightResizable,
  widthResizable,
  positionAndSizeLocked,
  onResizeStart,
  onResizeStop,
  aspectRatio,
  aspectRatioExtraHeight,
  aspectRatioExtraWidth,
  snapGrid,
  snapToGrid,
  children,
}) {
  const disablePointerEvents = useShouldDisablePointerEvents();

  const enable =
    disablePointerEvents || positionAndSizeLocked
      ? false
      : {
          top: false,
          left: false,
          bottom: heightResizable,
          right: widthResizable,
          topRight: false,
          bottomRight: heightResizable && widthResizable,
          topLeft: false,
          bottomLeft: false,
        };

  const inputClasses = `${
    disablePointerEvents ? "pointer-events-none select-none" : ""
  } ${bgColor} section-grid-cols section-grid-rows section-grid-areas grid h-full transition-radius ${!positionAndSizeLocked ? "rounded-xl shadow-md" : "rounded-sm"}   before:content-none before:block before:absolute before:top-0 before:right-0 before:bottom-0 before:left-0 before:border before:border-white dark:before:border-setta-700 ${isYouTube ? "overflow-clip" : ""} ${
    isActiveSection ? "z-[150]" : "z-10"
  }`;

  return (
    <ResizableWithScale
      id={`${sectionId}-CustomResizable`} // IMPORTANT, used as parent for codemirror autocomplete
      as={as}
      size={size}
      minHeight={minHeight}
      maxHeight={maxHeight}
      minWidth={minWidth}
      maxWidth={maxWidth}
      onResizeStart={onResizeStart}
      onResizeStop={onResizeStop}
      lockAspectRatio={aspectRatio}
      lockAspectRatioExtraHeight={aspectRatioExtraHeight}
      lockAspectRatioExtraWidth={aspectRatioExtraWidth}
      handleWrapperClass="absolute pointer-events-none [&>*]:pointer-events-auto h-full bottom-0 w-full nodrag [&>div]:z-20"
      enable={enable}
      className={inputClasses}
      handleStyles={{ right: { right: "-8px" }, bottom: { bottom: "-8px" } }}
      handleClasses={{
        // used in ZoomPane to allow resizing of sections that are inside a position-locked section
        right: `${SETTA_PREVENT_SECTION_ON_CLICK_TRIGGER} ${SETTA_PREVENT_SECTION_ACTIVE_CSS} ${NO_PAN_CLASS_NAME}`,
        bottom: `${SETTA_PREVENT_SECTION_ON_CLICK_TRIGGER} ${SETTA_PREVENT_SECTION_ACTIVE_CSS} ${NO_PAN_CLASS_NAME}`,
      }}
      grid={snapToGrid ? snapGrid : null}
    >
      {children}
    </ResizableWithScale>
  );
}

function useAspectRatio(sectionId) {
  return useSectionInfos((x) => {
    const s = x.x[sectionId];
    if (s.isMinimized) {
      return {
        size: s.size,
        aspectRatio: false,
        aspectRatioExtraHeight: 0,
        aspectRatioExtraWidth: 0,
      };
    }
    return {
      size: s.size,
      aspectRatio: s.aspectRatio ?? false,
      aspectRatioExtraHeight: s.aspectRatioExtraHeight ?? 0,
      aspectRatioExtraWidth: s.aspectRatioExtraWidth ?? 0,
    };
  }, _.isEqual);
}

function setSectionResizeEvent(sectionId, resizeEvent, state) {
  state.x[sectionId].resizeEvent = resizeEvent;
}
