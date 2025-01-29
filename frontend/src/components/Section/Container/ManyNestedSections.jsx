import { useDndChildren } from "forks/dnd-kit/dndChildren";
import { DNDSortable } from "forks/dnd-kit/DNDSortable";
import { goToSection } from "state/actions/sections/sectionPositions";
import { useSectionInfos } from "state/definitions";
import { SortableSectionContainer } from "./SortableSectionContainer";
import { useHasTempNested } from "./utils";

export function MaybeManyNestedSections({ sectionId, isGroup }) {
  const hasNested = useHasTempNested(sectionId);
  return (
    hasNested && (
      <div className="flex flex-col">
        <ManyNestedSections sectionId={sectionId} isGroup={isGroup} />
      </div>
    )
  );
}

function ManyNestedSections({ sectionId, isGroup }) {
  const tempChildIds = useDndChildren((x) => x.x[sectionId]);

  return (
    <DNDSortable sectionId={sectionId} items={tempChildIds}>
      <NestedSectionsWithMargin
        childIds={tempChildIds}
        sectionId={sectionId}
        isGroup={isGroup}
      />
    </DNDSortable>
  );
}

function NestedSectionsWithMargin({ childIds, sectionId, isGroup }) {
  const onClick = () => {
    goToSection(sectionId);
  };

  const isHorizontalOrientation = useSectionInfos(
    (x) => x.x[sectionId].isHorizontalOrientation,
  );

  return (
    <div className="flex items-stretch">
      {!isGroup && (
        <div
          className={`mr-2 mt-2 min-h-full w-2 rounded-full bg-white/30 transition-all duration-75 hover:cursor-pointer hover:bg-white/50 dark:bg-setta-700 hover:dark:bg-setta-600`}
          onClick={onClick}
        />
      )}
      <div
        className={`mt-2 flex ${isHorizontalOrientation ? "flex-row" : "flex-col "} items-start gap-2`}
      >
        {childIds.map((e) => (
          <SortableSectionContainer sectionId={e} key={`Nested-Sec-${e}`} />
        ))}
      </div>
    </div>
  );
}
