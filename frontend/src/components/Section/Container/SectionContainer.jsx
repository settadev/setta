import C from "constants/constants.json";
import _ from "lodash";
import React from "react";
import {
  getSectionType,
  getSectionViewingEditingModeVisibility,
} from "state/actions/sectionInfos";
import { useSectionInfos } from "state/definitions";
import { VIEWING_EDITING_MODE } from "utils/constants";
import { ContainerSwitch } from "./ContainerSwitch";
import { MaybeManyNestedSections } from "./ManyNestedSections";
import { SectionContainerCore } from "./SectionContainerCore";

function _SectionContainer({ sectionId, isTopLevel, dragListeners }) {
  const { visibility, viewingEditingMode, isGroup } = useSectionInfos((x) => {
    const { visibility, viewingEditingMode } =
      getSectionViewingEditingModeVisibility(sectionId, x);
    return {
      visibility,
      viewingEditingMode,
      isGroup: getSectionType(sectionId, x) === C.GROUP,
    };
  });

  if (viewingEditingMode === VIEWING_EDITING_MODE.USER && !visibility) {
    return null;
  }

  return (
    <ContainerSwitch
      isGroup={isGroup}
      sectionId={sectionId}
      dragListeners={dragListeners}
      isTopLevel={isTopLevel}
      visibility={visibility}
      viewingEditingMode={viewingEditingMode}
    >
      {!isGroup && (
        <SectionContainerCore
          sectionId={sectionId}
          viewingEditingMode={viewingEditingMode}
        />
      )}
      <MaybeManyNestedSections sectionId={sectionId} isGroup={isGroup} />
    </ContainerSwitch>
  );
}
export const SectionContainer = React.memo(_SectionContainer, (p, n) =>
  _.isEqual(p.dragListeners, n.dragListeners),
);
