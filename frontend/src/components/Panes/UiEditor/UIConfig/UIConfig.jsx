import { StandardSearch } from "components/Utils/atoms/search/StandardSearch";
import _ from "lodash";
import React from "react";
import { setParamUITypeConfig } from "state/actions/uiTypes/setParamUITypeConfig";
import { setParamUITypeId } from "state/actions/uiTypes/setParamUITypeId";
import { useSectionInfos } from "state/definitions";
import { useParamInfosForSidePane } from "state/hooks/sectionContents";
import { getParamUIType } from "state/hooks/uiTypes";
import { useMatchSorterFilter } from "state/hooks/utils";
import { SaveUITypeConfig } from "../SaveUITypeConfig";
import { UIConfigDropdownAndFields } from "./UIConfigDropdownAndFields";

const UIElement = React.memo(_UIElement, _.isEqual);

const _UIConfig = React.forwardRef(({ sectionId }, ref) => {
  const paramInfos = useParamInfosForSidePane(sectionId);
  return <UIConfigCore sectionId={sectionId} paramInfos={paramInfos} />;
});

export const UIConfig = React.memo(_UIConfig);

function UIConfigCore({ sectionId, paramInfos }) {
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
          <i className="gg-sort-az !scale-75  text-setta-600 dark:text-setta-400" />
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

function _UIElement({ sectionId, paramInfo }) {
  const paramInfoId = paramInfo.id;
  const uiType = useSectionInfos(
    (x) => getParamUIType(sectionId, paramInfoId, x),
    _.isEqual,
  );
  const paramName = paramInfo.name;

  const onSelect = (e) => {
    useSectionInfos.setState((state) => {
      setParamUITypeId({
        uiTypeId: e,
        sectionId,
        paramInfoId,
        state,
      });
    });
  };

  const onChange = (configName, newValueFn) => {
    setParamUITypeConfig({
      sectionId,
      paramInfoId,
      configProps: { configName, newValueFn },
    });
  };

  return (
    <div className="flex flex-col self-stretch text-left last:mb-[400px] hover:opacity-100 hover:duration-500 [&:hover_.uicfg-title]:text-black dark:[&:hover_.uicfg-title]:text-setta-200">
      <div className="flex items-center justify-between">
        <p className="uicfg-title  truncate text-xs font-semibold text-setta-500">
          {paramName}
        </p>
        <div className="flex gap-[0.1rem] place-self-end">
          <SaveUITypeConfig />
        </div>
      </div>

      <UIConfigDropdownAndFields
        onDropdownSelect={onSelect}
        selectedId={uiType.id}
        selectedType={uiType.type}
        onConfigChange={onChange}
        config={uiType.config}
        sectionId={sectionId}
        paramInfoId={paramInfoId}
      />
    </div>
  );
}
