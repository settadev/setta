import { useSectionRefs } from "state/definitions";

export function setSectionRef({ sectionId, withNested, selfOnly }) {
  useSectionRefs.setState((state) => {
    if (withNested) {
      state.withNested[sectionId] = withNested;
    } else {
      state.selfOnly[sectionId] = selfOnly;
    }
  });
}

export function deleteSectionRef({ sectionId }) {
  useSectionRefs.setState((state) => {
    delete state.withNested[sectionId];
    delete state.selfOnly[sectionId];
  });
}
