import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "forks/dnd-kit/CustomSortable";
import { isTempSection, useDndState } from "forks/dnd-kit/dndState";
import { TempDNDSection } from "forks/dnd-kit/DummySection";
import { useDndProps } from "forks/dnd-kit/useDndUtils";
import { useReactFlow } from "forks/xyflow/core/store";
import _ from "lodash";
import React, { useEffect, useState } from "react";
import { SectionContainer } from "./SectionContainer";

function _SortableSectionContainer({ sectionId }) {
  return isTempSection(sectionId) ? (
    <TempDNDSortableSectionContainer sectionId={sectionId} />
  ) : (
    <RegularSortableSectionContainer
      sectionId={sectionId}
      forceApplyTransform={false}
    />
  );
}

export const SortableSectionContainer = React.memo(_SortableSectionContainer);

function _TempDNDSortableSectionContainer({ sectionId }) {
  const [forceApplyTransform, setForceApplyTransform] = useState(true);

  useEffect(() => {
    // we want to force the temp section to appear on first render
    setForceApplyTransform(false);
  }, []);

  return (
    <RegularSortableSectionContainer
      sectionId={sectionId}
      forceApplyTransform={forceApplyTransform}
    />
  );
}

const TempDNDSortableSectionContainer = React.memo(
  _TempDNDSortableSectionContainer,
);

function _RegularSortableSectionContainer({ sectionId, forceApplyTransform }) {
  const animateLayoutChanges = useAnimateLayoutChanges();
  const dndProps = useDndProps({ sectionId, isTopLevel: false });

  // remove 'role' because we don't want sections to be "role=button"
  const {
    attributes: { role, ...restAttributes },
    listeners,
    setNodeRef,
    transform,
    transition,
    overIndex,
    items,
  } = useSortable({ ...dndProps, animateLayoutChanges });
  return (
    <SortableCore
      sectionId={sectionId}
      attributes={restAttributes}
      listeners={listeners}
      setNodeRef={setNodeRef}
      transform={transform}
      transition={transition}
      applyTransform={
        forceApplyTransform ||
        (overIndex !== null && overIndex !== -1) ||
        (items.length === 1 &&
          items[0] === sectionId &&
          isTempSection(sectionId))
      }
    />
  );
}

const RegularSortableSectionContainer = React.memo(
  _RegularSortableSectionContainer,
);

function _SortableCore({
  sectionId,
  attributes,
  listeners,
  setNodeRef,
  transform,
  transition,
  applyTransform,
}) {
  const overIsSelf = useDndState((x) => x.overId === sectionId);
  const scaledTransform = transformWithZoom(applyTransform ? transform : null);

  const style = {
    transform: CSS.Translate.toString(scaledTransform),
    transition,
    zIndex: overIsSelf ? 500 : undefined,
  };
  const stackProps = { style, ref: setNodeRef, ...attributes };

  return (
    <div
      className="relative flex w-full outline-none"
      {...stackProps}
      tabIndex="-1"
    >
      <TempSectionOrNot
        sectionId={sectionId}
        applyTransform={applyTransform}
        listeners={listeners}
      />
    </div>
  );
}

function TempSectionOrNot({ sectionId, applyTransform, listeners }) {
  if (isTempSection(sectionId)) {
    if (applyTransform) {
      return <TempDNDSection />;
    }
    return null;
  } else {
    return <SectionContainer sectionId={sectionId} dragListeners={listeners} />;
  }
}

const SortableCore = React.memo(
  _SortableCore,
  (p, n) =>
    p.sectionId === n.sectionId &&
    p.transform === n.transform &&
    p.transition === n.transition &&
    _.isEqual(p.listeners, n.listeners),
);

function transformWithZoom(transform) {
  if (transform) {
    const zoom = useReactFlow.getState().transform[2];
    return {
      ...transform,
      x: transform.x / zoom,
      y: transform.y / zoom,
    };
  }
  return transform;
}

function useAnimateLayoutChanges() {
  const isSorting = useDndState((x) => x.isSorting);
  return () => isSorting;
}
