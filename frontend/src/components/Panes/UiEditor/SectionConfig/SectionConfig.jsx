import C from "constants/constants.json";
import React from "react";
import { getSectionType } from "state/actions/sectionInfos";
import { useSectionInfos } from "state/definitions";
import { ChartAreaSettings } from "./ChartAreaSettings";
import { DrawAreaSettings } from "./DrawAreaSettings";
import { IframeSettings } from "./IframeSettings";
import { ImageAreaSettings } from "./ImageAreaSettings";
import { InfoAreaSettings } from "./InfoAreaSettings";
import { InputAreaSettings } from "./InputAreaSettings";
import { SocialAreaSettings } from "./SocialAreaSettings";

const _SectionConfig = React.forwardRef(({ sectionId }, ref) => {
  return <SectionConfigCore sectionId={sectionId} />;
});

export const SectionConfig = React.memo(_SectionConfig);

function SectionConfigCore({ sectionId }) {
  return (
    <div className="flex min-h-0 flex-col gap-1 overflow-y-clip">
      <SpecializedConfiguration sectionId={sectionId} />
    </div>
  );
}

function SpecializedConfiguration({ sectionId }) {
  const sectionType = useSectionInfos((x) => {
    return getSectionType(sectionId, x);
  });
  switch (sectionType) {
    case C.SECTION:
    case C.GLOBAL_VARIABLES:
      return <InputAreaSettings sectionId={sectionId} />;
    case C.INFO:
      return <InfoAreaSettings sectionId={sectionId} />;
    case C.DRAW:
      return <DrawAreaSettings sectionId={sectionId} />;
    case C.IMAGE:
      return <ImageAreaSettings sectionId={sectionId} />;
    case C.CHART:
      return <ChartAreaSettings sectionId={sectionId} />;
    case C.SOCIAL:
      return <SocialAreaSettings sectionId={sectionId} />;
    case C.IFRAME:
      return <IframeSettings sectionId={sectionId} />;
  }
}
