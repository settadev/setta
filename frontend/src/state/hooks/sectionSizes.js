import { SIZE_MODE } from "components/Utils/Resizable/utils";
import C from "constants/constants.json";
import _ from "lodash";
import { useEffect, useRef, useState } from "react";
import { getSectionType } from "state/actions/sectionInfos";
import {
  adjustAspectRatio,
  adjustSizeToBeAtLeastMin,
  setSectionSize,
} from "state/actions/sections/sectionSizes";
import { useSectionInfos } from "state/definitions";
import { getIsTwitterSection } from "./social";

export const INFINITE_MAX_HEIGHT = 100000;
const INFINITE_MAX_WIDTH = 100000;
export const PINNED_PARAMS_AREA_MIN_HEIGHT = 64;
const ROOT_SECTION_HEIGHT = 50;
const MINIMIZE_SECTION_HEIGHT = 32;

function getMinSectionHeight({
  sectionType,
  hideSearch,
  hideParams,
  isMinimized,
}) {
  if (isMinimized) {
    return MINIMIZE_SECTION_HEIGHT;
  }

  if (sectionType === C.SECTION) {
    if (hideSearch) {
      return 78;
    } else if (hideParams) {
      return 58;
    } else {
      return 104;
    }
  } else if (sectionType === C.LIST_ROOT || sectionType === C.DICT_ROOT) {
    return ROOT_SECTION_HEIGHT;
  } else if (sectionType === C.GLOBAL_VARIABLES) {
    return 78;
  } else if (sectionType === C.CODE) {
    return 58.2;
  } else if (sectionType === C.INFO) {
    return 98;
  } else if (sectionType === C.PARAM_SWEEP) {
    return 50;
  } else if (sectionType === C.TERMINAL) {
    return 100;
  } else if (sectionType === C.GLOBAL_PARAM_SWEEP) {
    return 112;
  } else if (sectionType === C.DRAW || sectionType === C.IMAGE) {
    return 100;
  } else if (sectionType === C.CHART) {
    return 300;
  } else if (sectionType === C.SOCIAL) {
    return 50;
  }
}

function getMaxSectionHeight({ sectionType, isMinimized }) {
  if (isMinimized) {
    return MINIMIZE_SECTION_HEIGHT;
  }
  if (sectionType === C.LIST_ROOT || sectionType === C.DICT_ROOT) {
    return ROOT_SECTION_HEIGHT;
  }
  return INFINITE_MAX_HEIGHT;
}

function getMinSectionWidth({ sectionType, isTwitter }) {
  if (isTwitter) {
    return 370;
  }
  if (sectionType === C.DRAW) {
    return 402;
  } else if (sectionType === C.CHART) {
    return 300;
  }

  return 200;
}

function getMaxSectionWidth({ isTwitter }) {
  if (isTwitter) {
    return 574;
  }
  return INFINITE_MAX_WIDTH;
}

function getSizeMode({ sectionType, hideParams, isTwitter }) {
  if (sectionType === C.SECTION) {
    if (hideParams) {
      return { height: SIZE_MODE.auto_only, width: SIZE_MODE.any };
    }
  } else if (sectionType === C.TERMINAL || sectionType === C.CHART) {
    return { height: SIZE_MODE.manual_only, width: SIZE_MODE.manual_only };
  }
  if (isTwitter) {
    return { height: SIZE_MODE.auto_only, width: SIZE_MODE.any };
  }
  return { height: SIZE_MODE.any, width: SIZE_MODE.any };
}

export function useSectionMinMaxDims(sectionId) {
  return useSectionInfos((x) => {
    const isTwitter = getIsTwitterSection(sectionId, x);
    const sectionType = getSectionType(sectionId, x);
    const hideSearch = x.x[sectionId].hideSearch;
    const hideParams = x.x[sectionId].hideParams;
    const isMinimized = x.x[sectionId].isMinimized;

    const minHeight = getMinSectionHeight({
      sectionType,
      hideSearch,
      hideParams,
      isMinimized,
    });

    const maxHeight = getMaxSectionHeight({
      sectionType,
      isMinimized,
    });

    const minWidth = getMinSectionWidth({ sectionType, isTwitter });
    const maxWidth = getMaxSectionWidth({ isTwitter });

    const sizeMode = getSizeMode({ sectionType, hideParams, isTwitter });

    return { minHeight, maxHeight, minWidth, maxWidth, sizeMode };
  }, _.isEqual);
}

export function useIsScrollable() {
  const [isScrollable, setIsScrollable] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    if (!elementRef.current) return;

    function checkScrollable() {
      if (elementRef.current) {
        setIsScrollable(
          elementRef.current.scrollHeight > elementRef.current.clientHeight,
        );
      }
    }

    // Set up ResizeObserver to monitor size changes
    const resizeObserver = new ResizeObserver(() => {
      checkScrollable();
    });

    // Set up MutationObserver to monitor content changes
    const mutationObserver = new MutationObserver(() => {
      checkScrollable();
    });

    // Start observing
    resizeObserver.observe(elementRef.current);
    mutationObserver.observe(elementRef.current, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
    });

    // Initial check
    checkScrollable();

    // Cleanup
    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, []);

  return { ref: elementRef, isScrollable };
}

async function setSectionToHaveAspectRatioAndMinSize(sectionId, imgSize) {
  const sectionType = getSectionType(sectionId);
  const minHeight = getMinSectionHeight({ sectionType });
  const minWidth = getMinSectionWidth({ sectionType });
  const currSize = useSectionInfos.getState().x[sectionId].size;

  let adjustedSize = adjustAspectRatio(
    currSize.height,
    currSize.width,
    imgSize.height,
    imgSize.width,
  );
  adjustedSize = adjustSizeToBeAtLeastMin(
    adjustedSize.height,
    adjustedSize.width,
    minHeight,
    minWidth,
  );

  const extraHeight = 24;
  adjustedSize.height += extraHeight;
  useSectionInfos.setState((state) => {
    setAspectRatioInfo({
      sectionId,
      aspectRatio: imgSize.width / imgSize.height,
      aspectRatioExtraHeight: extraHeight,
      size: adjustedSize,
      state,
    });
  });
}

export function useImgArtifactAreaSize(sectionId, image) {
  const [imgSize, setImgSize] = useState(null);

  const widthOrHeightIsAuto = useSectionInfos((x) => {
    const { width, height } = x.x[sectionId].size;
    return width === "auto" || height === "auto";
  });

  useEffect(() => {
    const x = { width: image.width, height: image.height };
    if (!_.isEqual(x, imgSize)) {
      setSectionToHaveAspectRatioAndMinSize(sectionId, x);
    }
    setImgSize(x);
  }, [image.src]);

  useEffect(() => {
    if (imgSize) {
      setSectionToHaveAspectRatioAndMinSize(sectionId, imgSize);
    }
  }, [widthOrHeightIsAuto]);

  return imgSize !== null;
}

export function setDrawAreaSectionSize({
  sectionId,
  imgSize,
  isNewImg,
  sectionWidth,
  sectionHeight,
  state,
}) {
  let canvasSize = {};
  const extraHeight = 120;
  const extraWidth = 24;

  if (imgSize) {
    if (sectionWidth === "auto" || sectionHeight === "auto" || isNewImg) {
      const sectionType = C.DRAW;
      const minHeight = getMinSectionHeight({ sectionType });
      const minWidth = getMinSectionWidth({ sectionType });
      canvasSize = adjustSizeToBeAtLeastMin(
        imgSize.height,
        imgSize.width,
        minHeight - extraHeight,
        minWidth - extraWidth,
      );
      setSectionSize(
        sectionId,
        {
          width: canvasSize.width + extraWidth,
          height: canvasSize.height + extraHeight,
        },
        state,
      );
    } else {
      canvasSize.width = sectionWidth - extraWidth;
      canvasSize.height = sectionHeight - extraHeight;
    }

    if (isNewImg) {
      setAspectRatioInfo({
        sectionId,
        aspectRatio: imgSize.width / imgSize.height,
        aspectRatioExtraHeight: extraHeight,
        aspectRatioExtraWidth: extraWidth,
        state,
      });
    }
  } else {
    const [defaultWidth, defaultHeight] = [500, 500];
    canvasSize.width =
      sectionWidth === "auto" ? defaultWidth : sectionWidth - extraWidth;
    canvasSize.height =
      sectionHeight === "auto" ? defaultHeight : sectionHeight - extraHeight;
    if (sectionWidth === "auto" || sectionHeight === "auto") {
      setSectionSize(
        sectionId,
        {
          width: canvasSize.width + extraWidth,
          height: canvasSize.height + extraHeight,
        },
        state,
      );
    }
  }

  return canvasSize;
}

export function useYouTubeSectionSize(sectionId) {
  const extraHeight = 22;
  const defaultSize = { width: 640, height: 360 };
  const { width, height } = useSectionInfos(
    (x) => x.x[sectionId].size,
    _.isEqual,
  );

  function setToDefaultSize() {
    defaultSize.height += extraHeight;
    useSectionInfos.setState((state) => {
      setAspectRatioInfo({
        sectionId,
        aspectRatio: 16 / 9,
        aspectRatioExtraHeight: extraHeight,
        size: defaultSize,
        state,
      });
    });
  }

  useEffect(() => {
    if (width === "auto" || height === "auto") {
      setToDefaultSize();
    }
  }, [width, height]);

  useEffect(() => {
    setSectionToHaveAspectRatioAndMinSize(sectionId, defaultSize);
  }, []);

  const playerSize =
    width === "auto" || height === "auto"
      ? {}
      : { width, height: height - extraHeight };

  return playerSize;
}

export function useTwitterSectionSize(sectionId) {
  useEffect(() => {
    useSectionInfos.setState((state) => {
      setAspectRatioInfo({
        sectionId,
        aspectRatio: null,
        aspectRatioExtraHeight: null,
        aspectRatioExtraWidth: null,
        size: { height: "auto" },
        state,
      });
    });
  }, []);
}

function setAspectRatioInfo({
  sectionId,
  size,
  aspectRatio,
  aspectRatioExtraHeight,
  aspectRatioExtraWidth,
  state,
}) {
  const s = state.x[sectionId];
  s.aspectRatio = aspectRatio;
  s.aspectRatioExtraHeight = aspectRatioExtraHeight;
  s.aspectRatioExtraWidth = aspectRatioExtraWidth;
  if (size) {
    setSectionSize(sectionId, size, state);
  }
}
