import C from "constants/constants.json";
import _ from "lodash";
import React from "react";
import { getSectionType } from "state/actions/sectionInfos";
import { useSectionInfos } from "state/definitions";
import { ContainerSwitch } from "./ContainerSwitch";
import { MaybeManyNestedSections } from "./ManyNestedSections";
import { SectionContainerCore } from "./SectionContainerCore";

function _SectionContainer({ sectionId, isTopLevel, dragListeners }) {
  const isGroup = useSectionInfos(
    (x) => getSectionType(sectionId, x) === C.GROUP,
  );

  return (
    <ContainerSwitch
      isGroup={isGroup}
      sectionId={sectionId}
      dragListeners={dragListeners}
      isTopLevel={isTopLevel}
    >
      {!isGroup && <SectionContainerCore sectionId={sectionId} />}
      <MaybeManyNestedSections sectionId={sectionId} isGroup={isGroup} />
    </ContainerSwitch>
  );
}
export const SectionContainer = React.memo(_SectionContainer, (p, n) =>
  _.isEqual(p.dragListeners, n.dragListeners),
);
