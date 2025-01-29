import C from "constants/constants.json";
import { useDndChildren } from "forks/dnd-kit/dndChildren";
import { getDndSectionId, useDndState } from "forks/dnd-kit/dndState";
import { BehaviorDropType } from "forks/dnd-kit/dropTypes";
import { getSectionRectWithNested } from "forks/xyflow/core/utils/graph";
import {
  getSectionParentId,
  getSectionType,
  getSectionVariant,
} from "state/actions/sectionInfos";
import { getIsRoot } from "state/actions/uiTypes/utils";
import { useSectionInfos } from "state/definitions";

export function onDragStart({ active }) {
  const { width, height } = getSectionRectWithNested(active.id);
  const dndState = useDndState.getState();
  dndState.setActive({
    id: active.id,
    isTopLevel: active.data.current.isTopLevel,
    width,
    height,
  });
  if (dndState.isMovingFree) {
    useDndChildren.getState().replaceWithTemp(active.id);
  }
}

export function useOnDragMove() {
  const isMovingFree = useDndState((x) => x.isMovingFree);
  if (isMovingFree) {
    return onDragMove;
  }
  return () => {};
}

function onDragMove({ active, collisions }) {
  const triggerDistCondition = collisions[0]?.triggerDistCondition;
  const dndState = useDndState.getState();

  if (triggerDistCondition !== dndState.triggerDistCondition) {
    useDndState.setState({ triggerDistCondition });
    const over = collisions[0];
    if (over && over.id === dndState.overId) {
      onDragOver({
        active,
        over,
        collisions,
        calledFromOnDragMove: true,
      });
    }
  }
}

export function useOnDragOver() {
  const isMovingFree = useDndState((x) => x.isMovingFree);
  if (isMovingFree) {
    return onDragOver;
  }
  return () => {};
}

function onDragOver({ active, over, collisions, calledFromOnDragMove }) {
  const overId = getOverId(over);
  const dndState = useDndState.getState();
  const dndChildrenState = useDndChildren.getState();
  const dndSectionId = getDndSectionId(active.id);
  const oldParentId = getDndParentId(dndSectionId);

  // There can be discrepancy between over and collisions due to the way state updates in DndContext.
  // Collisions will be more up-to-date. If it's empty, reset relevant state and return early.
  if (collisions.length === 0) {
    dndChildrenState.removeChild(dndSectionId);
    setNullBehavior(null);
    return;
  }

  if (calledFromOnDragMove && dndState.triggerDistCondition) {
    leftDistBehavior({
      active,
      over,
      dndChildrenState,
      oldParentId,
      dndSectionId,
      collisions,
    });
    return;
  }

  // Don't allow very recent overId to be revisited (hack to avoid infinite loops)
  if (!calledFromOnDragMove && overId && getTimeDiff(dndState, overId) < 100) {
    setNullBehavior(overId);
    return;
  }

  dndState.setTime(overId);

  // Dragging onto the pane or over self.
  if (!overId) {
    dndChildrenState.removeChild(dndSectionId);
    setNullBehavior(overId);
    return;
  }

  if (dndState.triggerDistCondition) {
    leftDistBehavior({
      active,
      over,
      dndChildrenState,
      oldParentId,
      dndSectionId,
      collisions,
    });
    return;
  }

  // Dragging over the temporary section
  if (dndSectionId === overId) {
    setNullBehavior(overId);
    return;
  }

  // If overId doesn't have a parent, then set newParent to be overId
  const newParentId = getDndParentId(overId) ?? overId;

  maybeMoveToNewParent({
    active,
    over,
    dndSectionId,
    oldParentId,
    newParentId,
    dndChildrenState,
    collisions,
  });
}

function maybeMoveToNewParent({
  active,
  over,
  dndSectionId,
  oldParentId,
  newParentId,
  dndChildrenState,
  collisions,
}) {
  const overId = getOverId(over);
  // Check if section can actually be dropped onto newParentId
  const behaviorDropType = getBehaviorDropType(active.id, newParentId);
  if (behaviorDropType === BehaviorDropType.INVALID) {
    dndChildrenState.removeChild(dndSectionId);
    useDndState.setState({ behaviorDropType, overId });
    return;
  }

  const newParentNumChildren = getSectionVariant(newParentId).children.length;

  // Special case where you move a section out of its parent
  // and back in, and the section is the only-child of the parent
  if (
    newParentNumChildren === 1 &&
    getSectionParentId(active.id) === newParentId
  ) {
    dndChildrenState.addChild({
      oldParentId,
      newParentId,
      childId: dndSectionId,
      index: 0,
    });
    return;
  }

  // I don't remember this logic, but it seems to help
  // prevent flickering when dragging a section into
  // a list with nested sections, from the left.
  if (overId === newParentId && newParentNumChildren > 0) {
    dndChildrenState.removeChild(dndSectionId);
    return;
  }

  // Check if the temporary section has a new parent
  if (newParentId !== oldParentId) {
    // If the active was from a sortable, and we're not in that sortable anymore.
    const newParentChildren = dndChildrenState.x[newParentId];
    const _index = newParentChildren.indexOf(overId);
    let index = _index;
    if (_index >= 0) {
      if (collisions[0].pastHalfway) {
        index = _index + 1;
      }
    } else {
      index = 0;
    }
    dndChildrenState.addChild({
      oldParentId,
      newParentId,
      childId: dndSectionId,
      index,
    });
  }

  setNullBehavior(overId);
}

function leftDistBehavior({
  active,
  over,
  dndChildrenState,
  oldParentId,
  dndSectionId,
  collisions,
}) {
  const overId = getOverId(over);
  // Consider overId to be the new parent, if it's not the temp section.
  if (overId !== dndSectionId) {
    maybeMoveToNewParent({
      active,
      over,
      dndSectionId,
      oldParentId,
      newParentId: overId,
      dndChildrenState,
      collisions,
    });
  }
}

function setNullBehavior(overId) {
  useDndState.setState({
    behaviorDropType: null,
    overId,
  });
}

function getTimeDiff(state, sectionId) {
  return Date.now() - (state.times[sectionId] ?? 0);
}

export function getDndParentId(dndSectionId) {
  return useDndChildren.getState().y[dndSectionId];
}

function getBehaviorDropType(activeId, newParentId) {
  // invalid
  // if parent can't have children
  // or if child can only be in group and parent is not a group
  // or if parent variant is frozen
  // or if dragged section is global variables (TODO: loosen this restriction)
  if (
    !getSectionIsRoot(newParentId) ||
    (getSectionCanOnlyBeChildOfGroup(activeId) &&
      !getSectionIsGroup(newParentId)) ||
    getSectionVariant(newParentId).isFrozen ||
    getSectionIsGlobalVariables(activeId)
  ) {
    return BehaviorDropType.INVALID;
  }

  return null;
}

function getOverId(over) {
  return over ? over.id : null;
}

function getSectionCanOnlyBeChildOfGroup(sectionId) {
  return ![C.SECTION, C.LIST_ROOT, C.DICT_ROOT].includes(
    getSectionType(sectionId),
  );
}

function getSectionIsGroup(sectionId) {
  return getSectionType(sectionId) === C.GROUP;
}

function getSectionIsGlobalVariables(sectionId) {
  return (
    useSectionInfos.getState().singletonSections[C.GLOBAL_VARIABLES] ===
    sectionId
  );
}

function getSectionIsRoot(sectionId) {
  return getIsRoot(getSectionType(sectionId));
}
