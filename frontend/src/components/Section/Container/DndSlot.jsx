import { BehaviorDropType, behaviorToPretty } from "forks/dnd-kit/dropTypes";
import { RiDragDropFill } from "react-icons/ri";

export function DndSlot({ behaviorDropType, children, isGroup }) {
  const text = behaviorToPretty[behaviorDropType];

  return (
    <>
      {behaviorDropType && (
        <DndSlotMiddle
          text={text}
          behaviorDropType={behaviorDropType}
          isGroup={isGroup}
        />
      )}
      {children}
    </>
  );
}

function DndSlotMiddle({ text, behaviorDropType, isGroup }) {
  return (
    <div
      className={`absolute z-20 grid h-full w-full justify-center ${
        isGroup ? "[place-content:end_center]" : "place-content-center"
      }`}
    >
      <DndSlotInner
        text={text}
        behaviorDropType={behaviorDropType}
        isGroup={isGroup}
      />
    </div>
  );
}

function DndSlotInner({ text, behaviorDropType, isGroup }) {
  const invalid = behaviorDropType === BehaviorDropType.INVALID;
  return (
    <div
      className={`grid h-8 min-w-60 select-none place-items-center rounded-full  text-sm font-bold uppercase tracking-widest text-white shadow-md backdrop-blur-sm transition-opacity ${
        invalid
          ? "[background-color:rgba(220,_38,_38,_0.8)]"
          : "[background-color:rgba(37,_99,_235,_0.8)]"
      } ${isGroup && "mb-8"}`}
    >
      <div className="flex items-center gap-2">
        <RiDragDropFill />
        {text}
      </div>
    </div>
  );
}
