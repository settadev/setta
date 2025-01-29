import { ResizableWithScale } from "components/Utils/Resizable/ResizableWithScale";
import { getChangedSize, SIZE_MODE } from "components/Utils/Resizable/utils";
import _ from "lodash";
import React, { useEffect, useRef, useState } from "react";
import { useColumnResizer } from "state/actions/sectionColumnWidth";
import { useSectionInfos } from "state/definitions";
import { useParametersRequestWaitingForLSPResult } from "state/hooks/lsp";
import { useParamIdsToShowInArea } from "state/hooks/sectionContents";
import {
  INFINITE_MAX_HEIGHT,
  PINNED_PARAMS_AREA_MIN_HEIGHT,
  useIsScrollable,
} from "state/hooks/sectionSizes";
import {
  NO_PAN_CLASS_NAME,
  SETTA_PREVENT_SECTION_ACTIVE_CSS,
} from "utils/constants";
import { GetParamSwitch } from "./GetParamSwitch";

function _ParamGroupContainer({ sectionId }) {
  const outerRef = useRef();
  const [maxNestedDepth, setMaxNestedDepth] = useState({
    pinned: 1,
    unpinned: 1,
  });

  const handleColumnResizeStart = useColumnResizer(
    sectionId,
    outerRef,
    Math.max(maxNestedDepth.pinned, maxNestedDepth.unpinned),
  );

  const waitingForResult = useParametersRequestWaitingForLSPResult(sectionId);
  // const waitingForResult = true;

  return (
    <div
      className="section-w-full section-row-pin-main -mt-3 flex flex-col overflow-y-hidden pt-2"
      ref={outerRef}
    >
      {waitingForResult ? (
        <i className="section-args gg-spinner mt-3 !scale-100 place-self-center before:!border-t-blue-500 after:!border-blue-500" />
      ) : (
        <>
          <GetPinnedParams
            sectionId={sectionId}
            outerRef={outerRef}
            handleColumnResizeStart={handleColumnResizeStart}
            setMaxNestedDepth={setMaxNestedDepth}
          />
          <GetUnpinnedParams
            sectionId={sectionId}
            handleColumnResizeStart={handleColumnResizeStart}
            setMaxNestedDepth={setMaxNestedDepth}
          />
        </>
      )}
    </div>
  );
}

export const ParamGroupContainer = React.memo(_ParamGroupContainer);

function GetPinnedParams({
  sectionId,
  outerRef,
  handleColumnResizeStart,
  setMaxNestedDepth,
}) {
  const { requiredParamIdsToPaths, topLevelParamIds } = useParamIdsToShowInArea(
    sectionId,
    true,
  );

  const maxNestedDepth = getLongestListLength(requiredParamIdsToPaths);

  useEffect(() => {
    setMaxNestedDepth((s) => ({ ...s, pinned: maxNestedDepth }));
  }, [maxNestedDepth]);

  return (
    topLevelParamIds.length > 0 && (
      <ResizablePinnedArea
        sectionId={sectionId}
        topLevelParamIds={topLevelParamIds}
        requiredParamIdsToPaths={requiredParamIdsToPaths}
        outerRef={outerRef}
        handleColumnResizeStart={handleColumnResizeStart}
      />
    )
  );
}

function ResizablePinnedArea({
  sectionId,
  topLevelParamIds,
  requiredParamIdsToPaths,
  outerRef,
  handleColumnResizeStart,
}) {
  const { sectionHeight, height } = useSectionInfos((x) => {
    return {
      sectionHeight: x.x[sectionId].size.height,
      height: x.x[sectionId].pinnedAreaHeight,
    };
  }, _.isEqual);
  const [initialMaxHeight, setInitialMaxHeight] = useState(INFINITE_MAX_HEIGHT);

  function onResizeStop(...props) {
    const { height } = getChangedSize({
      props,
      minHeight: "auto",
      sizeMode: { height: SIZE_MODE.any },
    });
    useSectionInfos.setState((state) => {
      state.x[sectionId].pinnedAreaHeight = height;
    });
  }

  useEffect(() => {
    setInitialMaxHeight(outerRef.current.clientHeight);
  }, []);

  const maxHeight =
    sectionHeight === "auto"
      ? INFINITE_MAX_HEIGHT
      : outerRef.current?.clientHeight ?? initialMaxHeight;

  const { ref, isScrollable } = useIsScrollable();

  return (
    <ResizableWithScale
      handleWrapperClass="nodrag"
      className="relative -mt-1 flex max-h-[50%] w-full flex-col items-start border-b border-white bg-blue-200/50 pb-3 pt-4 shadow-sm dark:border-setta-700/30 dark:bg-blue-950/30"
      as="section"
      size={{ height }}
      onResizeStop={onResizeStop}
      minHeight={PINNED_PARAMS_AREA_MIN_HEIGHT}
      maxHeight={maxHeight}
      enable={{
        top: false,
        left: false,
        bottom: true,
        right: false,
        topRight: false,
        bottomRight: false,
        topLeft: false,
        bottomLeft: false,
      }}
      handleClasses={{
        // used in ZoomPane to allow resizing of sections that are inside a position-locked section
        bottom: `${SETTA_PREVENT_SECTION_ACTIVE_CSS} ${NO_PAN_CLASS_NAME}`,
      }}
    >
      <header className="flex w-full gap-1 px-2">
        <i className="gg-pin-alt scale-25 ml-1 mr-[0.1rem] mt-[0.3rem] text-setta-300 after:text-setta-300 dark:text-setta-500 dark:after:text-setta-500" />
        <p className=" text-[0.5rem] font-bold uppercase text-setta-300 dark:text-setta-500">
          Pinned Params
        </p>
      </header>

      <div
        className={`${isScrollable ? "nowheel" : ""} section-args-nested section-key-value section-min-rows grid w-full grid-cols-subgrid gap-y-1 overflow-y-scroll pr-1.5`}
        ref={ref}
      >
        <GetParamSwitch
          sectionId={sectionId}
          paramIds={topLevelParamIds}
          requiredParamIdsToPaths={requiredParamIdsToPaths}
          onResizeStart={handleColumnResizeStart}
          isTopLevel={true}
        />
      </div>
    </ResizableWithScale>
  );
}

function GetUnpinnedParams({
  sectionId,
  handleColumnResizeStart,
  setMaxNestedDepth,
}) {
  const { ref, isScrollable } = useIsScrollable();
  const hideUnpinnedParams = useSectionInfos(
    (x) => x.x[sectionId].hideUnpinnedParams,
  );

  return (
    <div
      className={`section-args-nested grid auto-rows-min grid-cols-subgrid gap-y-1 overflow-x-clip overflow-y-scroll py-2 pr-1.5 ${
        isScrollable ? "nowheel" : ""
      } min-w-0 !max-w-full`}
      ref={ref}
    >
      {!hideUnpinnedParams && (
        <GetUnpinnedParamsCore
          sectionId={sectionId}
          onResizeStart={handleColumnResizeStart}
          setMaxNestedDepth={setMaxNestedDepth}
        />
      )}
    </div>
  );
}

function GetUnpinnedParamsCore({
  sectionId,
  onResizeStart,
  setMaxNestedDepth,
}) {
  const { requiredParamIdsToPaths, topLevelParamIds } = useParamIdsToShowInArea(
    sectionId,
    false,
  );

  const maxNestedDepth = getLongestListLength(requiredParamIdsToPaths);

  useEffect(() => {
    setMaxNestedDepth((s) => ({ ...s, unpinned: maxNestedDepth }));
  }, [maxNestedDepth]);

  return (
    <GetParamSwitch
      sectionId={sectionId}
      paramIds={topLevelParamIds}
      requiredParamIdsToPaths={requiredParamIdsToPaths}
      onResizeStart={onResizeStart}
      isTopLevel={true}
    />
  );
}

function getLongestListLength(obj) {
  return Object.values(obj).reduce(
    (max, arr) => (arr.length > max ? arr.length : max),
    0,
  );
}
