import C from "constants/constants.json";
import _ from "lodash";
import React from "react";
import { getSectionType } from "state/actions/sectionInfos";
import { useActiveSection, useSectionInfos } from "state/definitions";
import { useSectionRefAndInit } from "state/hooks/sectionRef";
import "./dndline.css";
import { SectionContainerCoreResizable } from "./SectionContainerCoreResizabe";
import { getOnSectionClick, getOutlineColor } from "./utils";

function _SectionContainerCore({ sectionId, viewingEditingMode }) {
  const {
    sectionTypeName,
    jsonSourceMissing,
    isInOtherProjectConfigs,
    positionAndSizeLocked,
  } = useSectionInfos((x) => {
    return {
      sectionTypeName: getSectionType(sectionId, x),
      jsonSourceMissing: x.x[sectionId].jsonSourceMissing,
      isInOtherProjectConfigs: x.x[sectionId].isInOtherProjectConfigs,
      positionAndSizeLocked: x.x[sectionId].positionAndSizeLocked,
    };
  }, _.isEqual);
  const isActiveSection = useActiveSection((x) => x.ids.includes(sectionId));
  const refForPosition = useSectionRefAndInit(sectionId, "selfOnly");
  const isGlobalVariables = sectionTypeName === C.GLOBAL_VARIABLES;

  // const boxShadow = !positionAndSizeLocked
  //   ? isActiveSection
  //     ? "shadow-2xl dark:shadow-setta-925"
  //     : "shadow-md dark:shadow-setta-900/30 [&:active:not(:has(button:active,:active.setta-prevent-section-active-css))]:shadow-2xl dark:[&:active:not(:has(button:active,:active.setta-prevent-section-active-css))]:shadow-[0_35px_60px_-15px_rgba(0,0,0,0.7)]"
  //   : "";

  const boxShadow = !positionAndSizeLocked
    ? "shadow-md dark:shadow-setta-900/30"
    : "";

  const outlineColor = getOutlineColor({
    isActiveSection,
    isGlobalVariables,
    isInOtherProjectConfigs,
    jsonSourceMissing,
  });

  // [transition:_outline-color_200ms_ease] [transition:_box-shadow_500ms_ease]
  return (
    <section
      className={`group/card-section transition-radius ${!positionAndSizeLocked ? "rounded-xl border-white dark:border-setta-700" : "rounded-sm border-setta-400/90 dark:border-setta-800"} border  bg-white  dark:bg-setta-925 ${boxShadow} dndline w-min outline outline-4 ${outlineColor}`}
      onClick={getOnSectionClick(sectionId, isActiveSection)}
      ref={refForPosition}
    >
      <SectionContainerCoreResizable
        sectionId={sectionId}
        sectionTypeName={sectionTypeName}
        isActiveSection={isActiveSection}
        isInOtherProjectConfigs={isInOtherProjectConfigs}
        viewingEditingMode={viewingEditingMode}
        positionAndSizeLocked={positionAndSizeLocked}
      />
    </section>
  );
}
export const SectionContainerCore = React.memo(
  _SectionContainerCore,
  (p, n) => p.viewingEditingMode === n.viewingEditingMode,
);
