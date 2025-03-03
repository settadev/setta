import C from "constants/constants.json";
import { useReactFlow } from "forks/xyflow/core/store";
import { getSectionRect } from "forks/xyflow/core/utils/graph";
import { addNodes } from "state/actions/nodeInternals";
import { maybeIncrementProjectStateVersion } from "state/actions/undo";
import { useSectionInfos, useSectionRefs } from "state/definitions";
import { localStorageFns } from "state/hooks/localStorage";
import { BASE_UI_TYPE_IDS } from "utils/constants";
import { newSectionInfo } from "utils/objs/sectionInfo";
import { newSectionVariant } from "utils/objs/sectionVariant";
import { focusOnSectionSearch } from "utils/tabbingLogic";
import { insertIntoArray } from "utils/utils";
import { setActiveSectionIdAndUpdateZIndex } from "../activeSections";
import { addChatHistoryArtifact, addDrawAreaLayer } from "../artifacts";
import { initRunGroup } from "../runGroups/runGroups";
import { setSectionVariantChildren } from "../sectionInfos";

export function addRegularSectionInEmptySpace() {
  let newId;
  useSectionInfos.setState((state) => {
    newId = addSectionInEmptySpace({ type: C.SECTION, state });
  });
  setActiveSectionIdAndUpdateZIndex(newId);
  const unsub = useSectionRefs.subscribe(
    (state) => state.selfOnly[newId],
    (newSectionRef) => {
      if (newSectionRef) {
        focusOnSectionSearch(newId);
      }
      unsub();
    },
  );
  maybeIncrementProjectStateVersion(true);
}

export function addGroupInEmptySpace() {
  let newId;
  useSectionInfos.setState((state) => {
    newId = addSectionInEmptySpace({ type: C.GROUP, state });
  });
  setActiveSectionIdAndUpdateZIndex(newId);
  maybeIncrementProjectStateVersion(true);
}

export function addTerminalInEmptySpace() {
  useSectionInfos.setState((state) => {
    addSectionInEmptySpace({ type: C.TERMINAL, state });
  });
  maybeIncrementProjectStateVersion(true);
}

export function addSectionInEmptySpace({
  type,
  sectionProps = {},
  sectionVariantProps = {},
  positionOffset = { x: 10, y: 10 },
  state,
}) {
  const {
    transform: [_x, _y, zoom],
  } = useReactFlow.getState();
  const [overviewWidth] = localStorageFns.overviewTrueWidth.state();

  const x = (overviewWidth - _x) / zoom;
  const y = -_y / zoom;

  const position = { x: x + positionOffset.x, y: y + positionOffset.y };

  return addSectionAtPosition({
    type,
    sectionProps,
    sectionVariantProps,
    position,
    state,
  });
}

export function addSectionAtPosition({
  type,
  sectionProps = {},
  sectionVariantProps = {},
  position,
  state,
}) {
  const [newId] = createSectionInfo({
    sectionProps: { ...sectionProps, uiTypeId: BASE_UI_TYPE_IDS[type] },
    sectionVariantProps,
    position,
    state,
  });
  return newId;
}

export function addChildrenToSeries(isRoot, calledBy, numChildren) {
  let newIds;
  useSectionInfos.setState((state) => {
    let parentId, startIdx;
    if (isRoot) {
      parentId = calledBy;
      startIdx = 0;
    } else {
      parentId = state.x[calledBy].parentId;
      startIdx =
        state.variants[state.x[parentId].variantId].children.indexOf(calledBy) +
        1;
    }

    newIds = createSectionInfo({
      sectionProps: {
        parentId,
        size: { height: "auto", width: state.x[parentId].size.width },
      },
      numSections: numChildren,
      state,
    });

    setSectionVariantChildren(
      parentId,
      (x) => insertIntoArray(x, startIdx, ...newIds),
      state,
    );
  });

  maybeIncrementProjectStateVersion(true);

  return newIds;
}

export function createSectionInfo({
  sectionProps = {},
  sectionVariantProps = {},
  numSections = 1,
  position,
  state,
}) {
  const newIds = [];
  const topLevelSectionIds = [];

  for (let i = 0; i < numSections; i++) {
    const s = newSectionInfo(sectionProps);
    newIds.push(s.id);
    state.x[s.id] = s;
    state.variants[s.variantId] = newSectionVariant(sectionVariantProps);
    switch (state.uiTypes[s.uiTypeId].type) {
      case C.GLOBAL_PARAM_SWEEP:
        initRunGroup(s.variantId, state);
        break;
      case C.DRAW:
        addDrawAreaLayer(s.id, state);
        break;
      case C.CHAT:
        addChatHistoryArtifact(s.id, state);
        break;
    }
    if (!s.parentId) {
      topLevelSectionIds.push(s.id);
    }
  }

  if (topLevelSectionIds.length > 0) {
    addNodes(
      topLevelSectionIds.map((s) => ({
        id: s,
        position,
        zIndex: 0,
        tempZIndex: 0,
      })),
    );
  }

  return newIds;
}

export function createAdjacentSection(sectionId, sectionProps, state) {
  const { x, y, width } = getSectionRect(sectionId);

  const position = {
    x: x + width,
    y,
  };

  createSectionInfo({ sectionProps, position, state });
}
