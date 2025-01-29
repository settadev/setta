import { YamlView } from "components/Params/YamlView";
import { StandardAccordion } from "components/Utils/atoms/accordion/accordion";
import { StandardSearch } from "components/Utils/atoms/search/StandardSearch";
import { ResizableWithScale } from "components/Utils/Resizable/ResizableWithScale";
import { getSectionRect } from "forks/xyflow/core/utils/graph";
import _ from "lodash";
import React from "react";
import { maybeRunGuiToYaml } from "state/actions/guiToYaml";
import { createNewVersion } from "state/actions/newVersion";
import {
  onClickSetVariantId,
  onMouseEnterSetPreviewVariantId,
  onMouseLeaveSetPreviewVariantId,
} from "state/actions/previewOnMouseOver";
import {
  initRunGroup,
  toggleRunGroup,
  toggleRunGroupSection,
  toggleRunGroupSectionParamSweep,
  toggleRunGroupSectionVersion,
  useRunGroupListing,
  useTopLevelRunGroupListing,
} from "state/actions/runGroups/runGroups";
import { useSectionInfos } from "state/definitions";
import { useGetParamSweepNames } from "state/hooks/paramSweep";
import { useIsScrollable } from "state/hooks/sectionSizes";
import { useGetSectionVariantNames } from "state/hooks/sectionVariants";
import { createRandomName } from "utils/idNameCreation";
import { useShowYaml } from "../../../state/hooks/toYaml";

export function GlobalParamSweepArea({ sectionId }) {
  const width = useSectionInfos((x) => {
    const w = x.x[sectionId].size.width;
    return w === "auto" ? getSectionRect(sectionId)?.width : w;
  });

  return <GlobalParamSweepGUI sectionId={sectionId} width={width} />;
}

function GlobalParamSweepGUI({ sectionId, width }) {
  const { ref, isScrollable } = useIsScrollable();

  return (
    <>
      <section
        className={`${width && width < 386 && isScrollable ? "nowheel" : ""} section-main -mr-3 mb-2 flex min-w-0 flex-col gap-2 overflow-y-scroll pr-2 @sm/multipane:flex-row @sm/multipane:gap-4  @sm/multipane:overflow-visible`}
        ref={ref}
      >
        <ResizablePane width={width}>
          <LeftSide sectionId={sectionId} />
        </ResizablePane>

        <RightSide sectionId={sectionId} />
      </section>
    </>
  );
}

function ResizablePane({ width, children }) {
  if (width > 384) {
    return (
      <ResizableWithScale
        className="nodrag relative -mr-2 flex flex-col pr-1"
        enable={{ right: true }}
        minWidth={100}
        maxWidth="70%"
        handleClasses={{
          right:
            "before:bg-transparent before:absolute before:top-0 before:h-3/4 before:bottom-0 before:left-0 before:right-0  before:m-auto before:w-1/4 hover:before:bg-blue-500 before:rounded-full",
        }}
      >
        {children}
      </ResizableWithScale>
    );
  }
  return <article className="-mr-2 flex flex-col pr-2">{children}</article>;
}

function LeftSide({ sectionId }) {
  return (
    <>
      <h3 className="mb-[0.55rem] ml-0.5 mt-2 text-xs font-bold uppercase text-setta-300 dark:text-setta-500">
        Run Groups
      </h3>

      <RunGroupList sectionId={sectionId} />
      <CreateNewRunGroupButton sectionId={sectionId} />
    </>
  );
}

function RightSide({ sectionId }) {
  const showYaml = useShowYaml(sectionId);
  const shownRunGroupId = useSectionInfos((x) => {
    return x.x[sectionId].previewVariantId ?? x.x[sectionId].variantId;
  });

  if (!shownRunGroupId) {
    return null;
  }
  // -mr-[14px]
  return (
    <article
      className={`${showYaml ? "-mr-2 overflow-visible @sm/multipane:-mr-[14px] @sm/multipane:overflow-y-scroll" : "h-full min-h-0 min-w-0 max-w-full overflow-x-clip"} mt-2 flex flex-1 flex-col pb-2 `}
    >
      {!showYaml ? (
        <>
          <div className="flex gap-4">
            <h3 className="text-xs font-bold uppercase text-setta-300 dark:text-setta-500">
              Sections
            </h3>
            <FilterSection />
          </div>

          <TopLevelSectionList runGroupId={shownRunGroupId} />
        </>
      ) : (
        <YamlView sectionId={sectionId} />
      )}
    </article>
  );
}

function RunGroupList({ sectionId }) {
  const { ref, isScrollable } = useIsScrollable();
  const { editingRunGroupId, runGroupsDetails, runGroupSelection } =
    useSectionInfos((x) => {
      const output = [];
      const { variantIds, variantId } = x.x[sectionId];
      for (const id of variantIds) {
        output.push({ id, name: x.variants[id].name });
      }
      return {
        runGroupsDetails: output,
        runGroupSelection: x.x[sectionId].selectedVariantIds,
        editingRunGroupId: variantId,
      };
    }, _.isEqual);

  return (
    <ul
      className={`${isScrollable ? "nowheel" : ""} flex flex-grow flex-col overflow-visible py-[2px] @sm/multipane:overflow-y-scroll`}
      ref={ref}
      onMouseLeave={() => onMouseLeaveSetPreviewVariantId(sectionId)}
    >
      {runGroupsDetails.map(({ id, name }) => (
        <CheckboxNextToLabel
          key={id}
          shown={editingRunGroupId === id}
          checked={runGroupSelection[id] ?? false}
          onChange={() => {
            toggleRunGroup(sectionId, id);
          }}
          onMouseEnter={() => onMouseEnterSetPreviewVariantId(sectionId, id)}
          onClick={() => onClickSetVariantId(sectionId, id)}
        >
          {name}
        </CheckboxNextToLabel>
      ))}
    </ul>
  );
}

function TopLevelSectionList({ runGroupId }) {
  const topLevelSections = useTopLevelRunGroupListing();
  const { ref, isScrollable } = useIsScrollable();
  return (
    <SectionListCore
      sections={topLevelSections}
      runGroupId={runGroupId}
      ref={ref}
      className={isScrollable ? "nowheel" : ""}
      ancestors={[]}
      parentIsSelected={true}
    />
  );
}

function SectionList({ ancestors, parentIsSelected, runGroupId }) {
  const sections = useRunGroupListing(
    ancestors[ancestors.length - 1].variantId,
  );
  return (
    <SectionListCore
      sections={sections}
      runGroupId={runGroupId}
      ancestors={ancestors}
      parentIsSelected={parentIsSelected}
    />
  );
}

const SectionListCore = React.forwardRef(
  (
    { sections, runGroupId, ancestors, parentIsSelected, className = "" },
    ref,
  ) => {
    return (
      sections.length > 0 && (
        <ul
          className={`${className} flex flex-grow flex-col overflow-visible rounded-lg bg-setta-50/40 pl-3 pr-2 pt-1 @sm/multipane:overflow-y-scroll dark:bg-setta-875`}
          ref={ref}
        >
          {sections.map((x, idx) => (
            <SectionItem
              key={idx}
              sectionInfo={x}
              ancestors={ancestors}
              parentIsSelected={parentIsSelected}
              runGroupId={runGroupId}
            />
          ))}
        </ul>
      )
    );
  },
);

function SectionItem({ sectionInfo, ancestors, parentIsSelected, runGroupId }) {
  const sectionId = sectionInfo.id;

  const parentVariantId =
    ancestors.length === 0 ? null : ancestors[ancestors.length - 1].variantId;

  function onSectionCheckboxChange() {
    toggleRunGroupSection({
      id: runGroupId,
      ancestors,
      sectionId,
      parentVariantId,
    });
  }

  const isSelected = useSectionInfos((x) => {
    return (
      parentIsSelected &&
      !!x.variants[runGroupId].runGroup[sectionId]?.[parentVariantId]?.selected
    );
  });

  return (
    <li className="flex flex-col">
      <CheckboxGroup checked={isSelected} onChange={onSectionCheckboxChange}>
        {sectionInfo.name}
      </CheckboxGroup>
      <MaybeVersionsList
        sectionId={sectionId}
        runGroupId={runGroupId}
        isSelected={isSelected}
        ancestors={ancestors}
        parentVariantId={parentVariantId}
      />
      <ParamSweepVersionsList
        sectionId={sectionId}
        runGroupId={runGroupId}
        isSelected={isSelected}
        ancestors={ancestors}
        parentVariantId={parentVariantId}
      />
    </li>
  );
}

function _MaybeVersionsList({
  sectionId,
  ancestors,
  runGroupId,
  isSelected,
  parentVariantId,
}) {
  const allVersions = useGetSectionVariantNames(sectionId);
  return allVersions.length > 1 ? (
    <VersionsList
      sectionId={sectionId}
      ancestors={ancestors}
      runGroupId={runGroupId}
      isSelected={isSelected}
      allVersions={allVersions}
      parentVariantId={parentVariantId}
    />
  ) : (
    <div className="pl-4">
      <SectionList
        ancestors={[
          ...ancestors,
          { id: sectionId, variantId: allVersions[0].id },
        ]}
        parentIsSelected={isSelected}
        runGroupId={runGroupId}
      />
    </div>
  );
}

const MaybeVersionsList = React.memo(_MaybeVersionsList, _.isEqual);

function VersionsList({
  sectionId,
  ancestors,
  runGroupId,
  isSelected,
  allVersions,
  parentVariantId,
}) {
  const atLeastOneVersionSelected = useSectionInfos((x) => {
    const versionsObj =
      x.variants[runGroupId].runGroup[sectionId]?.[parentVariantId]?.versions;
    if (!versionsObj) {
      return false;
    }
    for (const value of Object.values(versionsObj)) {
      if (value) return true;
    }
    return false;
  });

  const accordionRootStyles =
    atLeastOneVersionSelected || !isSelected
      ? undefined
      : "bg-red-100 dark:bg-red-950/20 hover:bg-red-500/20 border-red-300 hover:dark:bg-red-950/50 dark:border-red-700/80 hover:dark:border-red-700 [&_ul]:!bg-transparent";

  return (
    <GenericList
      inputList={allVersions}
      heading={"Versions"}
      isSelected={isSelected}
      sectionId={sectionId}
      runGroupId={runGroupId}
      ancestors={ancestors}
      parentVariantId={parentVariantId}
      accordionRootStyles={accordionRootStyles}
      ChildComponent={VersionItemComponent}
    />
  );
}

function _ParamSweepVersionsList({
  sectionId,
  ancestors,
  runGroupId,
  isSelected,
  parentVariantId,
}) {
  const allParamSweeps = useGetParamSweepNames(sectionId);

  return (
    allParamSweeps.length > 0 && (
      <GenericList
        inputList={allParamSweeps}
        heading="Param Sweeps"
        isSelected={isSelected}
        sectionId={sectionId}
        runGroupId={runGroupId}
        ancestors={ancestors}
        parentVariantId={parentVariantId}
        ChildComponent={ParamSweepItemComponent}
      />
    )
  );
}

const ParamSweepVersionsList = React.memo(_ParamSweepVersionsList, _.isEqual);

function _GenericList({
  inputList,
  heading,
  isSelected,
  sectionId,
  runGroupId,
  ancestors,
  parentVariantId,
  accordionRootStyles,
  ChildComponent,
}) {
  return (
    <StandardAccordion
      rootStyles={`${accordionRootStyles ?? "hover:bg-white hover:dark:bg-setta-700/10 hover:border-setta-50 dark:hover:border-setta-700"} border border-transparent rounded-lg px-2 ml-7 -mr-2 -mt-0.5`}
      itemStyles="focus-within:relative focus-within:z-10"
      headerStyles="flex flex-1 cursor-default items-center justify-between my-0.5 ml-1"
      triggerStyles="flex justify-between px-2 -mx-2 w-full items-center hover:cursor-pointer rounded-md italic text-xs font-semibold opacity-60 group-hover:opacity-100 text-setta-500 dark:text-setta-300 focus-visible:outline outline-blue-500"
      contentStyles="text-xs overflow-hidden mb-1 "
      heading={heading}
      value={heading}
      internalWrapper={false}
      // defaultValue={defaultValue}
      data-state={open}
    >
      <ul>
        {inputList.map((e, idx) => (
          <li
            key={idx}
            className="ml-[4px] flex min-h-6 cursor-pointer flex-col rounded"
          >
            <ChildComponent
              id={e.id}
              name={e.name}
              parentIsSelected={isSelected}
              sectionId={sectionId}
              runGroupId={runGroupId}
              ancestors={ancestors}
              parentVariantId={parentVariantId}
            />
          </li>
        ))}
      </ul>
    </StandardAccordion>
  );
}

const GenericList = React.memo(_GenericList, _.isEqual);

function VersionItemComponent({
  id,
  name,
  parentIsSelected,
  sectionId,
  runGroupId,
  ancestors,
  parentVariantId,
}) {
  function onChange() {
    toggleRunGroupSectionVersion({
      id: runGroupId,
      sectionId,
      versionId: id,
      ancestors,
      parentVariantId,
    });
  }

  const isSelected = useSectionInfos(
    (x) =>
      parentIsSelected &&
      !!x.variants[runGroupId].runGroup[sectionId]?.[parentVariantId].versions[
        id
      ],
  );

  return (
    <>
      <div className="flex items-center gap-2 truncate">
        <CheckboxGroup checked={isSelected} onChange={onChange}>
          {name}
        </CheckboxGroup>
      </div>
      <div className="pl-4">
        <SectionList
          parentIsSelected={isSelected}
          ancestors={[...ancestors, { id: sectionId, variantId: id }]}
          runGroupId={runGroupId}
        />
      </div>
    </>
  );
}

function ParamSweepItemComponent({
  id,
  name,
  parentIsSelected,
  ancestors,
  sectionId,
  runGroupId,
  parentVariantId,
}) {
  function onChange() {
    toggleRunGroupSectionParamSweep({
      id: runGroupId,
      ancestors,
      sectionId,
      paramSweepId: id,
      parentVariantId,
    });
  }

  const isSelected = useSectionInfos(
    (x) =>
      !!x.variants[runGroupId].runGroup[sectionId]?.[parentVariantId]
        .paramSweeps[id],
  );

  return (
    <CheckboxGroup checked={parentIsSelected && isSelected} onChange={onChange}>
      {name}
    </CheckboxGroup>
  );
}

function CheckboxGroup({ children, checked, onChange }) {
  return (
    <label className="flex min-h-6 cursor-pointer items-center gap-2 text-xs text-setta-700 dark:text-setta-300">
      <input
        type="checkbox"
        className="h-4 w-4 min-w-4 rounded-md bg-setta-500/10 outline-offset-2 outline-blue-500 checked:bg-blue-500 hover:bg-setta-500/30 hover:checked:bg-blue-500 focus-visible:outline"
        checked={checked}
        onChange={onChange}
      />
      <p className="truncate">{children}</p>
    </label>
  );
}

function CheckboxNextToLabel({
  children,
  checked,
  shown,
  onChange,
  onClick,
  onMouseEnter,
}) {
  return (
    <li
      className="group/runitem flex justify-between"
      onMouseEnter={onMouseEnter}
    >
      <label
        className={`flex min-h-6 cursor-pointer items-center gap-2 truncate rounded px-1 py-0.5 text-xs text-setta-700  group-hover/runitem:!text-blue-500 dark:text-setta-200 ${shown ? "font-bold !text-blue-500" : ""}`}
      >
        <input
          type="checkbox"
          className="h-4 w-4 min-w-4 cursor-pointer rounded-md bg-setta-500/15 outline-offset-2 outline-blue-500 checked:bg-blue-500 hover:bg-setta-500/30 hover:checked:bg-blue-500 focus-visible:outline"
          checked={checked}
          onChange={onChange}
        />

        <p className="truncate">{children}</p>
      </label>
      <button
        className={`mr-0.5 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full text-transparent outline-blue-500 hover:!text-setta-500  focus-visible:outline group-hover/runitem:text-setta-300 dark:hover:!text-setta-300 dark:group-hover/runitem:text-setta-600 ${shown ? "!text-blue-500" : ""}`}
        onClick={onClick}
      >
        <i className="gg-pen  " />
      </button>
    </li>
  );
}

function FilterSection() {
  const inputStyles =
    "flex-1 min-w-0 text-xs outline-0 cursor-auto bg-transparent [border-width:0_0_1px_0] border-solid border-transparent truncate focus-visible:border-blue-300 pl-4 py-1 placeholder-setta-300 dark:placeholder-setta-700 ";

  return (
    <div className="-mt-1 flex-1">
      <StandardSearch
        leftElement={
          <i className="gg-sort-az mb-[2px] !scale-50 text-setta-400" />
        }
        placeholder="Filter"
        inputStyles={inputStyles}
        outerClasses="flex-1"
      />
    </div>
  );
}

function CreateNewRunGroupButton({ sectionId }) {
  async function onClick() {
    createNewRunGroup(sectionId);
  }

  return (
    <button
      className="nodrag mt-2 flex min-w-0 cursor-pointer select-none items-center justify-center gap-1 rounded-md border border-solid border-setta-100 px-2 py-1 text-xs font-bold uppercase leading-none text-setta-400 outline-none transition-colors duration-150 hover:bg-setta-50 focus-visible:!border-blue-500 focus-visible:outline-none focus-visible:ring-0 dark:border-setta-800 dark:text-setta-500 dark:hover:bg-setta-800 dark:hover:text-setta-400"
      onClick={onClick}
    >
      <span className="relative">
        <i className="gg-add-r absolute" />
      </span>
      New Run Group
    </button>
  );
}

function createNewRunGroup(sectionId) {
  let newVariantId;
  useSectionInfos.setState((state) => {
    const newVersionName = createRandomName();
    ({ newVariantId } = createNewVersion(sectionId, newVersionName, state));
    initRunGroup(newVariantId, state);
  });
  maybeRunGuiToYaml(sectionId, newVariantId);
}
