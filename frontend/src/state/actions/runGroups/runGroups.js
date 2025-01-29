import C from "constants/constants.json";
import _ from "lodash";
import { getSectionType } from "state/actions/sectionInfos";
import { useNodeInternals, useSectionInfos } from "state/definitions";

const RUNNABLE_SECTION_TYPES = [
  C.SECTION,
  C.LIST_ROOT,
  C.DICT_ROOT,
  C.GROUP,
  C.GLOBAL_VARIABLES,
  C.CODE,
];

// use inside of setState
export function initRunGroup(variantId, state) {
  state.variants[variantId].runGroup = { sections: {} };
  for (const c of useNodeInternals.getState().x.keys()) {
    if (RUNNABLE_SECTION_TYPES.includes(getSectionType(c))) {
      maybeInitRunGroupSection(variantId, c, null, state);
    }
  }
}

export function toggleRunGroup(sectionId, runGroupId) {
  useSectionInfos.setState((x) => {
    const selections = x.x[sectionId].selectedVariantIds;
    if (runGroupId in selections) {
      delete selections[runGroupId];
    } else {
      selections[runGroupId] = true;
    }
  });
}

function newRunGroupSection(sectionId, initVariantId, state) {
  return {
    selected: true,
    paramSweeps: {},
    versions: { [initVariantId ?? state.x[sectionId].variantId]: true },
  };
}

// must use inside of setState
function maybeInitRunGroupSection(
  runGroupId,
  sectionId,
  parentVariantId,
  state,
  initVariantId = null,
) {
  let isNewInit = false;
  if (!(sectionId in state.variants[runGroupId].runGroup)) {
    state.variants[runGroupId].runGroup[sectionId] = {};
    maybeInitAllDescendants(
      runGroupId,
      initVariantId ?? state.x[sectionId].variantId,
      state,
    );
    isNewInit = true;
  }
  if (!(parentVariantId in state.variants[runGroupId].runGroup[sectionId])) {
    state.variants[runGroupId].runGroup[sectionId][parentVariantId] =
      newRunGroupSection(sectionId, initVariantId, state);
    isNewInit = true;
  }

  return isNewInit;
}

function maybeInitAllDescendants(runGroupId, variantId, state) {
  for (const c of state.variants[variantId].children) {
    maybeInitRunGroupSection(runGroupId, c, variantId, state);
  }
}

// must use inside of setState
function forceAllAncestorsToBeSelected(runGroupId, ancestors, state) {
  for (const [idx, a] of ancestors.entries()) {
    const parentVariantId = idx === 0 ? null : ancestors[idx - 1].variantId;
    maybeInitRunGroupSection(runGroupId, a.id, parentVariantId, state);
    const currState =
      state.variants[runGroupId].runGroup[a.id][parentVariantId];
    currState.versions[a.variantId] = true;
    currState.selected = true;
  }
}

function allAncestorsAreSelected(runGroupId, ancestors, state) {
  for (const [idx, a] of ancestors.entries()) {
    const parentVariantId = idx === 0 ? null : ancestors[idx - 1].variantId;
    if (
      !state.variants[runGroupId].runGroup[a.id]?.[parentVariantId].versions[
        a.variantId
      ] ||
      !sectionIsSelected(runGroupId, a.id, parentVariantId, state)
    ) {
      return false;
    }
  }
  return true;
}

function sectionIsSelected(runGroupId, sectionId, parentVariantId, state) {
  return state.variants[runGroupId].runGroup[sectionId]?.[parentVariantId]
    .selected;
}

function toggleRunGroupSectionAttr({
  runGroupId,
  ancestors,
  sectionId,
  attrName,
  attrId,
  parentVariantId,
}) {
  useSectionInfos.setState((state) => {
    const isNewInit = maybeInitRunGroupSection(
      runGroupId,
      sectionId,
      parentVariantId,
      state,
      attrName === "versions" ? attrId : null,
    );
    let newState;
    const thisSectionState =
      state.variants[runGroupId].runGroup[sectionId][parentVariantId];
    // if not new init, and if all ancestors are selected, and (when toggling version or paramsweep) the section itself is selected
    if (
      !isNewInit &&
      allAncestorsAreSelected(runGroupId, ancestors, state) &&
      (attrName === "selected" ||
        sectionIsSelected(runGroupId, sectionId, parentVariantId, state))
    ) {
      newState = attrId
        ? !thisSectionState[attrName][attrId]
        : !thisSectionState[attrName];
    } else {
      newState = true;
    }

    if (attrId) {
      thisSectionState[attrName][attrId] = newState;
    } else {
      thisSectionState[attrName] = newState;
    }
    if (newState) {
      // if we set version or param sweep to true, we also need to set selected to true
      // (if we're already setting selected, this is redundant, but doesn't hurt)
      thisSectionState.selected = true;
      // if toggled to be selected, force all ancestors to be selected too
      forceAllAncestorsToBeSelected(runGroupId, ancestors, state);

      // if any children haven't been initialized, then it means we're
      // selecting this section or version for the first time
      // so by default we want all children to be selected too.
      if (attrName === "selected" || attrName === "versions") {
        const variantId =
          attrName === "versions" ? attrId : state.x[sectionId].variantId;
        maybeInitAllDescendants(runGroupId, variantId, state);
      }
    }
  });
}

export function toggleRunGroupSection({
  id,
  ancestors,
  sectionId,
  parentVariantId,
}) {
  toggleRunGroupSectionAttr({
    runGroupId: id,
    ancestors,
    sectionId,
    attrName: "selected",
    parentVariantId,
  });
}

export function toggleRunGroupSectionParamSweep({
  id,
  paramSweepId,
  ancestors,
  sectionId,
  parentVariantId,
}) {
  toggleRunGroupSectionAttr({
    runGroupId: id,
    ancestors,
    sectionId,
    attrName: "paramSweeps",
    attrId: paramSweepId,
    parentVariantId,
  });
}

export function toggleRunGroupSectionVersion({
  id,
  versionId,
  ancestors,
  sectionId,
  parentVariantId,
}) {
  toggleRunGroupSectionAttr({
    runGroupId: id,
    ancestors,
    sectionId,
    attrName: "versions",
    attrId: versionId,
    parentVariantId,
  });
}

// export function setAllRunGroupsAndMaybeCreateSection(runGroups) {
//   const stateFormat = {};
//   for (const [name, runGroup] of Object.entries(runGroups)) {
//     stateFormat[createNewId()] = {
//       name,
//       selected: runGroup.selected,
//       sections: parsePrettyRunGroupSections(runGroup),
//     };
//   }

//   setAllRunGroups(stateFormat);
//   if (!useSectionInfos.getState().singletonSections[C.GLOBAL_PARAM_SWEEP]) {
//   } else {
//   }
// }

// function parsePrettyRunGroupSections(runGroup) {
//   const sections = {};
//   for (const [sectionName, sectionDetails] of Object.entries(runGroup)) {
//     // const s = getSectionByName(sectionName);
//     sections[s.id] = {};
//     // TODO
//     // for (const [paramSweepName, paramSweepIsSelected] of Object.entries(
//     //   sectionDetails,
//     // )) {
//     //   sections[s.id][]
//     // }
//   }
//   return sections;
// }

export function useRunGroupListing(variantId) {
  return useSectionInfos((x) => {
    const output = [];
    for (const childId of x.variants[variantId].children) {
      if (
        RUNNABLE_SECTION_TYPES.includes(x.uiTypes[x.x[childId].uiTypeId].type)
      ) {
        output.push({ id: childId, name: x.x[childId].name });
      }
    }
    return output;
  }, _.isEqual);
}

export function useTopLevelRunGroupListing() {
  return useSectionInfos((x) => {
    const output = [];
    for (const [k, v] of Object.entries(x.x)) {
      if (
        !v.parentId &&
        RUNNABLE_SECTION_TYPES.includes(x.uiTypes[x.x[k].uiTypeId].type)
      ) {
        output.push({ id: k, name: v.name });
      }
    }
    return output;
  }, _.isEqual);
}

export function updateRunGroupsWithNewHierarchy(newHierarchy, oldHierarchy) {
  useSectionInfos.setState((state) => {
    const globalParamSweepSectionId =
      state.singletonSections[C.GLOBAL_PARAM_SWEEP];
    if (!globalParamSweepSectionId) {
      return;
    }
    for (const [sectionId, parentId] of Object.entries(newHierarchy)) {
      if (
        !(sectionId in oldHierarchy) ||
        parentId === oldHierarchy[sectionId]
      ) {
        continue;
      }
      const { variantIds } = state.x[globalParamSweepSectionId];
      for (const variantId of variantIds) {
        const runGroup = state.variants[variantId].runGroup;
        if (!(sectionId in runGroup)) {
          continue;
        }
        const newParentVariantIds = parentId
          ? state.x[parentId].variantIds
          : [null];
        for (const newParentVariantId of newParentVariantIds) {
          runGroup[sectionId][newParentVariantId] = newRunGroupSection(
            sectionId,
            undefined,
            state,
          );
        }
      }
    }
  });
}
