import { SectionYamlView } from "components/Params/YamlView";
import _ from "lodash";
import React from "react";
import { getDisplayedSectionVariant } from "state/actions/sectionInfos";
import { useSectionInfos } from "state/definitions";
import { useShowYaml } from "../../../state/hooks/toYaml";
import { ParamGroupContainer } from "../../Params/GroupContainer";
import { KwargsControls } from "../SectionParts/KwargsControls";
import { SectionSearch } from "../SectionParts/Search";

function _APIArea({ sectionId, bgColor }) {
  const { selectedItem, hideParams } = useSectionInfos((x) => {
    const { selectedItem } = getDisplayedSectionVariant(sectionId, x);
    return {
      selectedItem,
      hideParams: x.x[sectionId].hideParams,
    };
  }, _.isEqual);
  const showYaml = useShowYaml(sectionId);

  return (
    <>
      {!showYaml && (
        <SectionSearch sectionId={sectionId} selectedItem={selectedItem} />
      )}
      {!showYaml && !hideParams && (
        <>
          <KwargsControls
            sectionId={sectionId}
            objInfoId={selectedItem}
            bgColor={bgColor}
          />
          <ParamGroupContainer sectionId={sectionId} />
        </>
      )}
      {!!showYaml && <SectionYamlView sectionId={sectionId} />}
    </>
  );
}

export const APIArea = React.memo(_APIArea);
