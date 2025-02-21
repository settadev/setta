import { StandardSearch } from "components/Utils/atoms/search/StandardSearch";
import _ from "lodash";
import React from "react";
import { useSectionInfos } from "state/definitions";
import { useParamInfosForSidePane } from "state/hooks/sectionContents";
import { useMatchSorterFilter } from "state/hooks/utils";

const UIElement = React.memo(_UIElement, _.isEqual);

const _QuickInfoConfig = React.forwardRef(({ sectionId }, ref) => {
  const paramInfos = useParamInfosForSidePane(sectionId);
  return <QuickInfoConfigCore sectionId={sectionId} paramInfos={paramInfos} />;
});

function QuickInfoConfigCore({ sectionId, paramInfos }) {
  const [filteredList, setFilter] = useMatchSorterFilter(
    paramInfos,
    ["name"],
    50,
  );

  const inputStyles =
    "flex-grow outline-0 min-w-0 w-full cursor-auto bg-transparent [border-width:0_0_1px_0] border-solid border-setta-200 dark:border-setta-800 focus-visible:!border-blue-300 pl-5 py-1 truncate placeholder-setta-400 dark:placeholder-setta-700 text-sm";

  return (
    <div className="flex flex-1 flex-col gap-1 overflow-y-hidden">
      <StandardSearch
        inputStyles={inputStyles}
        // leftElementStyles="pl-1"
        placeholder="Filter"
        leftElement={
          <i className="gg-sort-az !scale-75 text-setta-600 dark:text-setta-400" />
        }
        onChange={(e) => setFilter(e.target.value)}
      />
      <div className="mt-4 flex flex-col gap-2 overflow-y-scroll [&>*]:mx-[2px]">
        {sectionId &&
          filteredList.map((e, idx) => (
            <UIElement
              sectionId={sectionId}
              paramInfo={e}
              key={`${e.name}-${idx}`}
            />
          ))}
      </div>
    </div>
  );
}

export const QuickInfoConfig = React.memo(_QuickInfoConfig);

function _UIElement({ paramInfo }) {
  const { id, name } = paramInfo;
  const description = useSectionInfos((x) => x.codeInfo[id].description);

  return (
    <div className="flex flex-col gap-2 self-stretch text-left last:mb-[400px] hover:opacity-100 hover:duration-500 [&:hover_.uicfg-title]:text-black dark:[&:hover_.uicfg-title]:text-setta-200">
      <p className="uicfg-title truncate text-xs font-semibold text-setta-500">
        {name}
      </p>
      <textarea
        className="mx-[2px] mb-4 h-12 min-w-0 flex-grow cursor-auto rounded-lg border border-solid border-setta-100 bg-white px-2 py-1 font-mono text-xs font-medium text-setta-600 outline-0 placeholder:text-setta-200 focus-visible:border-white focus-visible:ring-2 dark:border-setta-800 dark:bg-setta-900 dark:text-setta-300 dark:placeholder:text-setta-700 dark:focus-visible:border-setta-900"
        value={description}
        onChange={(e) => {
          useSectionInfos.setState((state) => {
            state.codeInfo[id].description = e.target.value;
          });
        }}
      />
    </div>
  );
}
