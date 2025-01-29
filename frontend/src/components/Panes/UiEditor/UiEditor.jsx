import { getFloatingBoxHandlers } from "components/Utils/FloatingBox";
import { PaneContainer } from "components/Utils/PaneContainer";
import _ from "lodash";
import { BsCardChecklist } from "react-icons/bs";
import { FiEdit3 } from "react-icons/fi";
import { MdOutlineSettingsApplications } from "react-icons/md";
import { PiCursorTextFill } from "react-icons/pi";
import { TbEdit, TbVersions } from "react-icons/tb";
import { useActiveSection } from "state/definitions";
import { localStorageFns } from "state/hooks/localStorage";
import { useUIEditorTab } from "state/hooks/uiTypes";
import {
  INFO_CONFIG_TAB,
  QUICKINFO_CONFIG_TAB,
  SECTION_CONFIG_TAB,
  SECTION_VARIANTS_TAB,
  tabNameToPretty,
  UI_CONFIG_TAB,
  UI_EDITOR,
} from "utils/constants";
import { uiEditorPaneOnKeyDown } from "utils/tabbingLogic";
import { getOnUIEditorTabClick, TabButton } from "../paneFns";
import { MarkdownEditorInPane } from "./MarkdownEditor/MarkdownEditor";
import { QuickInfoConfig } from "./QuickInfoConfig/QuickInfoConfig";
import { SectionConfig } from "./SectionConfig/SectionConfig";
import { VersionList } from "./SectionVariants/VersionList";
import { UIConfig } from "./UIConfig/UIConfig";

const paneName = UI_EDITOR;

export function UiEditor() {
  const sectionIds = useActiveSection((x) => x.ids, _.isEqual);
  const { tab, requiredTabs, uiTypeName, renderMarkdown } = useUIEditorTab(
    sectionIds[0],
  );
  const [vis] = localStorageFns.uiEditorVis.hook();
  const [width] = localStorageFns.uiEditorWidth.hook();
  const infoTabTooltip = renderMarkdown ? "Markdown Editor" : "Text Editor";
  const inputTitle = tab === INFO_CONFIG_TAB ? infoTabTooltip : null;

  const commonProps = {
    vis,
    tab,
    onTabClick: getOnUIEditorTabClick(uiTypeName),
    className:
      "flex h-10 w-10 cursor-pointer items-center justify-center text-2xl focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-light-blue-500",
    requiredTabs,
  };

  return (
    <div
      id="UiEditorPane"
      className="contents"
      onKeyDown={uiEditorPaneOnKeyDown}
    >
      <div className="absolute right-0 z-[19] flex h-[calc(100%_-_48px)] w-[50px] flex-col items-center gap-1 border-l border-setta-200/75 bg-setta-50 py-3 dark:border-setta-850 dark:bg-setta-900">
        <TabButton
          tabName={SECTION_CONFIG_TAB}
          {...commonProps}
          {...getFloatingBoxHandlers({ content: "Section Config" })}
        >
          <MdOutlineSettingsApplications />
        </TabButton>
        <TabButton
          tabName={UI_CONFIG_TAB}
          {...commonProps}
          {...getFloatingBoxHandlers({ content: "Parameter UI Config" })}
        >
          <BsCardChecklist />
        </TabButton>
        <TabButton
          tabName={QUICKINFO_CONFIG_TAB}
          {...commonProps}
          {...getFloatingBoxHandlers({ content: "Parameter Info Editing" })}
        >
          <TbEdit />
        </TabButton>
        <TabButton
          tabName={INFO_CONFIG_TAB}
          {...commonProps}
          {...getFloatingBoxHandlers({ content: infoTabTooltip })}
        >
          {/* <FaMarkdown /> */}
          <PiCursorTextFill />
        </TabButton>
        <TabButton
          tabName={SECTION_VARIANTS_TAB}
          {...commonProps}
          {...getFloatingBoxHandlers({ content: "Section Variants" })}
        >
          <TbVersions />
        </TabButton>
      </div>
      <PaneContainer
        paneName={paneName}
        right={true}
        minimumWidth={425}
        vis={vis}
        width={width}
      >
        {sectionIds.length === 1 && vis ? (
          <TabsVisible
            sectionId={sectionIds[0]}
            tab={tab}
            inputTitle={inputTitle}
          />
        ) : (
          <Placeholder />
        )}
      </PaneContainer>
    </div>
  );
}

function TabsVisible({ sectionId, tab, inputTitle }) {
  const title = inputTitle ?? tabNameToPretty[tab];
  return (
    <div className="flex h-full min-h-0 w-[calc(100%_-_3rem)] min-w-0 flex-1 flex-col overflow-hidden pr-1.5">
      <h2 className="mb-1 cursor-pointer select-none text-xs font-bold uppercase tracking-tight text-setta-300 dark:text-setta-500">
        {title}
      </h2>
      <TabContent sectionId={sectionId} tab={tab} />
    </div>
  );
}

function TabContent({ sectionId, tab }) {
  switch (tab) {
    case SECTION_CONFIG_TAB:
      return <SectionConfig sectionId={sectionId} />;
    case UI_CONFIG_TAB:
      return <UIConfig sectionId={sectionId} />;
    case QUICKINFO_CONFIG_TAB:
      return <QuickInfoConfig sectionId={sectionId} />;
    case INFO_CONFIG_TAB:
      return <MarkdownEditorInPane sectionId={sectionId} />;
    case SECTION_VARIANTS_TAB:
      return <VersionList sectionId={sectionId} />;
  }
}

function Placeholder() {
  return (
    <aside className="grid h-full min-h-0 w-[calc(100%_-_2rem)]">
      <div className="flex flex-col items-center gap-4 place-self-center">
        <FiEdit3 className="h-20 w-20 text-setta-300 dark:text-setta-700 " />
        <h4 className="text-center text-lg font-bold tracking-widest text-setta-300 dark:text-setta-600">
          Select A Section to Edit
        </h4>
      </div>
    </aside>
  );
}
