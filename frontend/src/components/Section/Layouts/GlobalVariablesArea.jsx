import { SectionYamlView } from "components/Params/YamlView";
import React from "react";
import { useShowYaml } from "../../../state/hooks/toYaml";
import { ParamGroupContainer } from "../../Params/GroupContainer";
import { KwargsControls } from "../SectionParts/KwargsControls";

function _GlobalVariablesArea({ sectionId, bgColor, isUserView }) {
  const showYaml = useShowYaml(sectionId);

  return !showYaml ? (
    <>
      {!isUserView && (
        <KwargsControls
          sectionId={sectionId}
          objInfoId={null}
          bgColor={bgColor}
        />
      )}
      <ParamGroupContainer sectionId={sectionId} />
    </>
  ) : (
    <SectionYamlView sectionId={sectionId} />
  );
}

export const GlobalVariablesArea = React.memo(_GlobalVariablesArea);
