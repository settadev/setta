import { DragOverlay } from "forks/dnd-kit/CustomCore";
import { useDndState } from "forks/dnd-kit/dndState";
import { useReactFlow } from "forks/xyflow/core/store";
import _ from "lodash";
import React from "react";
import { TbDragDrop } from "react-icons/tb";

export const TempDNDSection = React.forwardRef(({}, ref) => {
  const { width, height } = useDndState(
    (x) => ({
      width: x.width,
      height: x.height,
    }),
    _.isEqual,
  );

  // The 2nd div (flex-auto) is needed to make dnd work from the right
  return (
    <>
      <div
        style={{ width: `${width}px`, height: `${height}px` }}
        className="flex items-center justify-center rounded-xl bg-setta-100/70 shadow-inner dark:bg-setta-500/60"
        ref={ref}
      >
        <TbDragDrop className="scale-150 text-xl font-black text-setta-50 dark:text-setta-400/70" />
      </div>
      <div className="flex-auto bg-transparent" />
    </>
  );
});

const DummySection = React.forwardRef(({}, ref) => {
  const zoom = useReactFlow((x) => x.transform[2]);
  const { width, height } = useDndState(
    (x) => ({
      width: x.width,
      height: x.height,
    }),
    _.isEqual,
  );

  const displayWidth = width * zoom;
  const displayHeight = height * zoom;

  return (
    <div
      style={{
        width: `${displayWidth}px`,
        height: `${displayHeight}px`,
      }}
      className="rounded-xl bg-blue-500/90 shadow-lg dark:bg-blue-700/90"
      ref={ref}
    />
  );
});

export const DummyDragOverlay = React.forwardRef((props, ref) => {
  const activeId = useDndState((x) => x.activeId);

  return (
    activeId && (
      <DragOverlay dropAnimation={null}>
        <DummySection ref={ref} />
      </DragOverlay>
    )
  );
});
