import { useDndMonitor } from "forks/dnd-kit/CustomCore";
import { useDndMode, useDndState } from "forks/dnd-kit/dndState";
import _ from "lodash";
import { useEffect } from "react";
import { getSectionParentId } from "state/actions/sectionInfos";
import { useSectionInfos } from "state/definitions";
import { useSectionVariantIsFrozen } from "state/hooks/sectionVariants";
import colors from "tailwindcss/colors";
import { BehaviorDropType } from "./dropTypes";

export function useHighlightDroppable({ sectionId, isGroup }) {
  const padding = !isGroup ? "0.75rem" : "";
  const margin = !isGroup ? "-0.75rem" : "";
  return useDndState((x) => {
    const behaviorDropType = x.overId === sectionId ? x.behaviorDropType : null;
    return {
      behaviorDropType,
      style:
        behaviorDropType === BehaviorDropType.INVALID
          ? {
              borderRadius: "1.5rem",
              padding: padding,
              margin: margin,
              backgroundColor: colors.red[600],
            }
          : {},
    };
  }, _.isEqual);
}

export function useDisableSortable(sectionId) {
  const { isSorting, isMovingFree } = useDndMode();
  const disabled = useDndState((x) => x.disabled[sectionId]);
  const setDisabled = useDndState((x) => x.setDisabled);
  const variantIsFrozen = useSectionVariantIsFrozen(sectionId);

  useEffect(() => {
    setDisabled(sectionId, {
      draggable: variantIsFrozen,
      droppable: true,
    });
  }, [variantIsFrozen]);

  function activeIdInAncestorSet(activeId) {
    let parentId = getSectionParentId(sectionId);
    while (parentId) {
      if (activeId === parentId) {
        return true;
      }
      parentId = getSectionParentId(parentId);
    }
    return false;
  }

  function enableSort({ active }) {
    if (variantIsFrozen) {
      return;
    }

    // Freely moving a section outside of the current section and its children
    if (
      isMovingFree &&
      active.id !== sectionId &&
      !activeIdInAncestorSet(active.id)
    ) {
      setDisabled(sectionId, { draggable: false, droppable: false });
    }
    // Sorting a child of this section
    else if (
      isSorting &&
      active.data.current.sortable?.containerId === sectionId
    ) {
      setDisabled(sectionId, { draggable: false, droppable: false });
    }
  }

  function onDragDone() {
    setDisabled(sectionId, { draggable: variantIsFrozen, droppable: true });
  }

  useDndMonitor({
    onDragStart: enableSort,
    onDragEnd: onDragDone,
    onDragCancel: onDragDone,
  });

  return disabled ?? { draggable: variantIsFrozen, droppable: true };
}

export function useDndProps({ sectionId, isTopLevel }) {
  // We only want to set disabled if positionAndSizeLocked is true.
  // If positionAndSizeLocked is false, we don't want to set disabled to false,
  // so we set it to null instead so that the disabled
  // status defers to dnd-kit's "global" disabled status.
  // "onlyChildId" is the id of the child if the parent has just 1 child.
  // It is needed to correctly trigger the leftDistCondition in collisionDetection.
  const { hasNested, disabled, onlyChildId } = useSectionInfos((x) => {
    const variantId = x.x[sectionId]?.variantId;
    const children = variantId ? x.variants[variantId].children : [];
    return {
      hasNested: children.length > 0,
      onlyChildId: children.length === 1 ? children[0] : null,
      disabled: x.x[sectionId]?.positionAndSizeLocked
        ? x.x[sectionId]?.positionAndSizeLocked
        : null,
    };
  }, _.isEqual);

  return {
    id: sectionId,
    data: { isTopLevel, hasNested, onlyChildId },
    disabled,
  };
}
