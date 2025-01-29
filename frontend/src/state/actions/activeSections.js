import C from "constants/constants.json";
import _ from "lodash";
import {
  useActiveSection,
  useNodeInternals,
  useSectionInfos,
} from "state/definitions";
import { getHighestAncestor, getSectionType } from "./sectionInfos";
import { getAllVisibleParamsInSection } from "./sections/sectionContents";
import { setZIndices } from "./sections/sectionPositions";

export function setActiveSectionIds(ids) {
  useActiveSection.setState({ ids });
}

export function addActiveSectionIds(ids) {
  useActiveSection.setState((state) => ({
    ids: [...new Set([...state.ids, ...ids])],
  }));
}

export function removeActiveSectionIds(ids) {
  useActiveSection.setState((state) => ({ ids: _.difference(state.ids, ids) }));
}

export function clearActiveSectionIds() {
  useActiveSection.setState({ ids: [] });
}

export function setActiveSectionIdAndUpdateZIndex(id) {
  setActiveSectionIds([id]);
  const highestAncestor = getHighestAncestor(id);
  setZIndices([highestAncestor], false);
}

export function selectAll() {
  const currActiveSections = useActiveSection.getState().ids;

  // select all params within single active section
  if (currActiveSections.length === 1) {
    useSectionInfos.setState((state) => {
      const sectionId = currActiveSections[0];
      const ids = getAllVisibleParamsInSection(sectionId, state);
      for (const p of ids) {
        state.codeInfo[p].isSelected = true;
      }
    });
  } else {
    // select all sections
    setActiveSectionIds(Object.keys(useSectionInfos.getState().x));
  }
}

export function setTopLevelNonGroupSectionsAsActive() {
  const topLevelSections = Array.from(useNodeInternals.getState().x.values());
  const nonGroup = topLevelSections.filter(
    (s) => getSectionType(s.id) !== C.GROUP,
  );
  setActiveSectionIds(nonGroup.map((x) => x.id));
}
