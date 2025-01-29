import { useState } from "react";
import { TbSortDescendingSmallBig } from "react-icons/tb";
import { addChildrenToSeries } from "state/actions/sections/createSections";
import { deleteChildrenFromSeries } from "state/actions/sections/deleteSections";
import { useSectionVariantIsFrozen } from "state/hooks/sectionVariants";

export function Incrementer({ sectionId, isRoot, popover = false }) {
  const variantIsFrozen = useSectionVariantIsFrozen(sectionId);

  const addSections = (numSections) => {
    addChildrenToSeries(isRoot, sectionId, numSections);
  };

  const deleteChildren = (numSections) => {
    deleteChildrenFromSeries(isRoot, sectionId, numSections);
  };

  const numSectionsOnChange = (value) => {
    if (value && !isNaN(value)) {
      setNumSections(parseInt(value));
    } else {
      setNumSections("");
    }
  };

  const [numSections, setNumSections] = useState(1);
  return (
    <div
      className={`section-key-value section-row-main -mx-2 flex items-center gap-1 rounded-lg  bg-setta-100 pl-2 pr-1 dark:bg-setta-950 ${popover ? "border border-solid border-white py-1 shadow-lg dark:border-setta-800" : ""}`}
    >
      {isRoot ? (
        <>
          <TbSortDescendingSmallBig className="text-setta-300 dark:text-setta-600" />
          <p className="text-[10px] font-bold text-setta-500">Children: </p>
        </>
      ) : (
        <p className="text-[10px] text-setta-500">Siblings</p>
      )}

      <input
        className="nodrag max-w-[3ch] cursor-auto rounded-md bg-white px-2 text-xs focus-visible:ring-2 dark:bg-setta-800 dark:text-setta-300"
        value={numSections}
        onChange={(e) => numSectionsOnChange(e.target.value)}
        disabled={variantIsFrozen}
      />

      <button
        className="nodrag gg-math-minus rounded-full focus-visible:ring-2 dark:text-setta-300"
        onClick={() => deleteChildren(numSections)}
        role="button"
        disabled={variantIsFrozen}
      />

      <button
        className="nodrag gg-math-plus rounded-full focus-visible:ring-2 dark:text-setta-300"
        onClick={() => addSections(numSections)}
        role="button"
        disabled={variantIsFrozen}
      />
    </div>
  );
}
