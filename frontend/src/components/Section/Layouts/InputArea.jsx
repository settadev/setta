import { SectionYamlView } from "components/Params/YamlView";
import _ from "lodash";
import React from "react";
import { getDisplayedSectionVariant } from "state/actions/sectionInfos";
import { useSectionInfos } from "state/definitions";
import { useShowYaml } from "../../../state/hooks/toYaml";
import { ParamGroupContainer } from "../../Params/GroupContainer";
import { KwargsControls } from "../SectionParts/KwargsControls";
import { SectionSearch } from "../SectionParts/Search";

function _InputArea({ sectionId, bgColor }) {
  const { selectedItem, hideSearch, hideParams } = useSectionInfos((x) => {
    return {
      selectedItem: getDisplayedSectionVariant(sectionId, x).selectedItem,
      hideSearch: x.x[sectionId].hideSearch,
      hideParams: x.x[sectionId].hideParams,
    };
  }, _.isEqual);
  const showYaml = useShowYaml(sectionId);

  return (
    <>
      {!showYaml && !hideSearch && (
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

export const InputArea = React.memo(_InputArea);
