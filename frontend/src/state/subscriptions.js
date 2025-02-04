import C from "constants/constants.json";
import { useDndChildren } from "forks/dnd-kit/dndChildren";
import { useReactFlow } from "forks/xyflow/core/store";
import _ from "lodash";
import {
  useArtifacts,
  useEVRefRegex,
  useMisc,
  useNodeInternals,
  useSectionInfos,
  useTemplateVarRegex,
} from "state/definitions";
import { getNamePathTypeKey } from "./actions/artifacts";
import { getEVRefRegexAndColorMap } from "./actions/evRefRegex";
import {
  getNodeUpdateInformation,
  updateNodeDimensions,
} from "./actions/nodeInternals";
import { maybeOpenRenameReferencesModal } from "./actions/referenceRenaming";
import { updateRunGroupsWithNewHierarchy } from "./actions/runGroups/runGroups";
import {
  getCodeInfoCol,
  getDisplayedSectionIdToChildren,
  getSectionIdToParentId,
  getSectionType,
  getSectionVariant,
} from "./actions/sectionInfos";
import { getTemplateVarsRegexAndColorMap } from "./actions/templateVarsRegex";

export function subscribe() {
  useSectionInfos.subscribe(
    singletonSectionsSubscriptionFn,
    (x) => {
      useSectionInfos.setState((state) => {
        state.singletonSections = x;
      });
    },
    { equalityFn: _.isEqual },
  );

  useSectionInfos.subscribe(
    regexSubscriptionFn,
    (x) => {
      useEVRefRegex.setState(getEVRefRegexAndColorMap(x));
      useTemplateVarRegex.setState(getTemplateVarsRegexAndColorMap(x));
      if (useSectionInfos.getState().shouldRenameReferences) {
        // reset the flag used by subscriptions
        useSectionInfos.setState({ shouldRenameReferences: false });
        maybeOpenRenameReferencesModal();
      }
    },
    { equalityFn: _.isEqual },
  );

  useSectionInfos.subscribe(
    getDisplayedSectionIdToChildren,
    (x) => {
      useDndChildren.getState().update(x);
    },
    { equalityFn: _.isEqual },
  );

  useSectionInfos.subscribe(
    getSectionIdToParentId,
    (newVal, oldVal) => {
      updateRunGroupsWithNewHierarchy(newVal, oldVal);
    },
    { equalityFn: _.isEqual },
  );

  useReactFlow.subscribe(
    reactFitViewOnInitSubscriptionFn,
    (newState, prevState) => {
      if (
        prevState.fitViewOnInit &&
        prevState.fitViewOnInitDone &&
        newState.fitViewOnInit &&
        newState.fitViewOnInitDone
      ) {
        // set fitViewOnInit to false if it was and is true
        // and fitViewOnInitDone was and is done (need to wait for it to execute the fitView function on project load)
        // because that means zoom or x/y position must have changed
        useReactFlow.setState({ fitViewOnInit: false });
      }

      // used by forked xterm to make text appear correctly
      window.reactFlowZoom = newState.transform[2];
    },
    { equalityFn: _.isEqual },
  );

  useMisc.subscribe(
    updateNodeDimensionsSubscriptionFn,
    (shouldUpdate) => {
      if (shouldUpdate) {
        updateNodeDimensions(
          getNodeUpdateInformation(useNodeInternals.getState().x.keys(), false),
        );
        useMisc.setState({
          requestUpdateNodeDimensions: false,
        });
      }
    },
    { equalityFn: _.isEqual },
  );

  useMisc.subscribe(
    (x) => x.undoOrRedoWasTriggered,
    (undoOrRedoWasTriggered) => {
      if (undoOrRedoWasTriggered) {
        useMisc.setState((state) => ({
          updateDrawAreas: state.updateDrawAreas + 1,
          undoOrRedoWasTriggered: false,
        }));
      }
    },
  );

  useArtifacts.subscribe(
    artifactNamePathTypeToIdSubscriptionFn,
    (artifacts) => {
      useArtifacts.setState(() => {
        const namePathTypeToId = {};
        for (const [id, a] of Object.entries(artifacts)) {
          namePathTypeToId[getNamePathTypeKey(a)] = id;
        }
        return { namePathTypeToId };
      });
    },
    { equalityFn: _.isEqual },
  );
}

function singletonSectionsSubscriptionFn(state) {
  const output = {
    [C.GLOBAL_VARIABLES]: null,
    [C.GLOBAL_PARAM_SWEEP]: null,
    inMemoryFnStdoutTerminal: null,
  };
  for (const s of Object.values(state.x)) {
    const uiType = state.uiTypes[s.uiTypeId]?.type;
    if (
      output[C.GLOBAL_VARIABLES] &&
      output[C.GLOBAL_PARAM_SWEEP] &&
      output.inMemoryFnStdoutTerminal
    ) {
      break;
    }
    if (!output[C.GLOBAL_VARIABLES] && uiType === C.GLOBAL_VARIABLES) {
      output[C.GLOBAL_VARIABLES] = s.id;
    }
    if (!output[C.GLOBAL_PARAM_SWEEP] && uiType === C.GLOBAL_PARAM_SWEEP) {
      output[C.GLOBAL_PARAM_SWEEP] = s.id;
    }
    if (
      !output.inMemoryFnStdoutTerminal &&
      uiType === C.TERMINAL &&
      s.isReadOnlyTerminal
    ) {
      output.inMemoryFnStdoutTerminal = s.id;
    }
  }
  return output;
}

function regexSubscriptionFn(x) {
  const output = {
    details: {},
    codeInfo: _.mapValues(x.codeInfo, (c) => ({
      id: c.id,
      name: c.name,
      rcType: c.rcType,
    })),
    globalVariableId: x.singletonSections[C.GLOBAL_VARIABLES],
    templateVarEligibleSections: { importPath: [], version: [] },
  };

  let sectionVariant, sectionTypeName;
  for (const [id, s] of Object.entries(x.x)) {
    sectionVariant = getSectionVariant(id, x);
    sectionTypeName = getSectionType(id, x);
    output.details[id] = {
      name: s.name,
      sectionChildren: sectionVariant.children,
      codeInfoChildren: getCodeInfoCol(id, x).children,
      sectionTypeName,
      selectedItem: sectionVariant.selectedItem,
      isTopLevelAndCanHaveEVRefs:
        !s.parentId &&
        [
          C.GLOBAL_VARIABLES,
          C.SECTION,
          C.LIST_ROOT,
          C.DICT_ROOT,
          C.GROUP,
        ].includes(sectionTypeName),
    };

    if (sectionTypeName === C.CODE) {
      output.templateVarEligibleSections.importPath.push(id);
    }
    output.templateVarEligibleSections.version.push(id);
  }

  return output;
}

function reactFitViewOnInitSubscriptionFn(state) {
  return {
    transform: state.transform,
    fitViewOnInit: state.fitViewOnInit,
    fitViewOnInitDone: state.fitViewOnInitDone,
  };
}

function updateNodeDimensionsSubscriptionFn(state) {
  return state.undoOrRedoWasTriggered || state.requestUpdateNodeDimensions;
}

function artifactNamePathTypeToIdSubscriptionFn(state) {
  const output = {};
  for (const [id, a] of Object.entries(state.x)) {
    output[id] = { name: a["name"], path: a["path"], type: a["type"] };
  }
  return output;
}
