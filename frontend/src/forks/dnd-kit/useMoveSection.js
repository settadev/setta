import { getDndSectionId, useDndState } from "forks/dnd-kit/dndState";
import { screenToFlowPosition } from "forks/xyflow/core/hooks/useViewportHelper";
import { useRef } from "react";
import { justMoveANode } from "state/actions/nodeInternals";
import {
  getDisplayedSectionVariant,
  getSectionParentId,
  manualDndChildrenReset,
  setSectionVariantChildren,
  updateSectionInfos,
} from "state/actions/sectionInfos";
import {
  maybeMakeCopyOfSection,
  moveSection,
} from "state/actions/sections/moveSections";
import { maybeIncrementProjectStateVersion } from "state/actions/undo";
import { useSectionInfos } from "state/definitions";
import { updateWithArrayMove } from "utils/utils";
import { computeNewIndex } from "./CustomSortable/strategies/computeNewIndex";
import { useDndChildren } from "./dndChildren";
import { BehaviorDropType } from "./dropTypes";

function onSortEnd({ active, over }) {
  if (over && active.id !== over.id) {
    useSectionInfos.setState((state) => {
      setSectionVariantChildren(
        active.data.current.sortable?.containerId,
        updateWithArrayMove(active, over),
        state,
      );
    });

    maybeIncrementProjectStateVersion(true);
  }
}

async function onFreeMoveEnd({ active, over, collisions, dummyRef }) {
  const dndChildrenState = useDndChildren.getState();
  const sectionId = active.id;
  const dndSectionId = getDndSectionId(sectionId);
  const overId = over?.id;
  const oldParentId = getSectionParentId(sectionId);
  let newParentId = dndChildrenState.y[dndSectionId] ?? null;
  let activeIdx = null;
  let newIndex = null;
  let position = null;
  const behaviorDropType = useDndState.getState().behaviorDropType;

  if (newParentId) {
    const children = dndChildrenState.x[newParentId];
    activeIdx = children.indexOf(dndSectionId);
    const overIdx = children.indexOf(overId);
    const pastHalfway = collisions[0].pastHalfway;
    const maxIdx = children.length;
    newIndex = computeNewIndex(activeIdx, overIdx, pastHalfway, maxIdx);
  }
  // dropping nested section onto pane
  else if (!overId) {
    newIndex = 0;
    const { x, y } = dummyRef.current.getBoundingClientRect();
    position = screenToFlowPosition({ x, y });

    if (!oldParentId) {
      justMoveANode(sectionId, position);
      return;
    }
  }

  if (behaviorDropType === BehaviorDropType.INVALID) {
    manualDndChildrenReset();
    return;
  }

  // If dropping the section into where it already was,
  // then just do manualDndChildrenReset
  if (
    oldParentId === newParentId &&
    getDisplayedSectionVariant(oldParentId).children.indexOf(sectionId) ===
      newIndex
  ) {
    manualDndChildrenReset();
    return;
  }

  const maybeNewSectionData = await maybeMakeCopyOfSection({
    sectionId,
    oldParentId,
    newParentId,
  });

  let newSectionId;
  useSectionInfos.setState((state) => {
    if (maybeNewSectionData.sections) {
      updateSectionInfos({ ...maybeNewSectionData, state });
      newSectionId = Object.keys(maybeNewSectionData.sections)[0];
    } else {
      newSectionId = maybeNewSectionData;
    }

    moveSection({
      oldParentId,
      newParentId,
      oldSectionId: sectionId,
      newSectionId,
      newIndex,
      position,
      state,
    });

    state.shouldRenameReferences = true;
  });
}

export function useOnDragEnd() {
  const dummyRef = useRef(null);

  function onDragEnd({ active, over, collisions }) {
    if (useDndState.getState().isSorting) {
      onSortEnd({ active, over });
    } else if (useDndState.getState().isMovingFree) {
      onFreeMoveEnd({
        active,
        over,
        collisions,
        dummyRef,
      });
    } else {
      manualDndChildrenReset();
    }
    // don't reset isMovingFree or isSorting
    const additionalResetState = (state) => ({
      isMovingFree: state.getState().isMovingFree,
      isSorting: state.getState().isSorting,
      disabled: state.getState().disabled,
    });
    useDndState.getState().reset(additionalResetState);
  }

  return { dummyRef, onDragEnd };
}
