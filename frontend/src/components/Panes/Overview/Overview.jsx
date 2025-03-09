import { getFloatingBoxHandlers } from "components/Utils/FloatingBox";
import { PaneContainer } from "components/Utils/PaneContainer";
import { Controls } from "forks/xyflow/controls";
import { BiHelpCircle } from "react-icons/bi";
import { HiOutlineEye } from "react-icons/hi";
import { MdNotificationsNone } from "react-icons/md";
import { localStorageFns } from "state/hooks/localStorage";
import { OVERVIEW } from "utils/constants";
import { overviewPaneOnKeyDown } from "utils/tabbingLogic";
import {
  onOverviewResizeStop,
  onOverviewTabClick,
  TabButton,
} from "../paneFns";
import { NotificationsArea } from "./NotificationsArea";
import { ProjectConfigs } from "./ProjectConfigs";
import { ProjectOverview } from "./ProjectOverview";
import { ViewingEditingMode } from "./ViewingEditingMode";

const paneName = OVERVIEW;

export function Overview() {
  const [tab] = localStorageFns.overviewTab.hook();
  const [vis] = localStorageFns.overviewVis.hook();
  const [width] = localStorageFns.overviewWidth.hook();
  const commonProps = {
    vis,
    tab,
    onTabClick: onOverviewTabClick,
    className:
      "flex h-10 w-10 cursor-pointer items-center justify-center focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-light-blue-500",
  };

  // The ProjectOverviewButtonDiv div id is used when tabbing from document.body
  return (
    <div
      id="OverviewPane"
      className="contents"
      onKeyDown={overviewPaneOnKeyDown}
    >
      <div className="absolute left-0 z-[19] flex h-[calc(100%_-_48px)] w-[50px] flex-col items-center gap-1 border-r border-setta-200/75 bg-setta-50 py-3 dark:border-setta-850 dark:bg-setta-900">
        <TabButton
          tabName="tab1"
          {...commonProps}
          {...getFloatingBoxHandlers({ content: "Project Overview" })}
        >
          <i className="gg-list  !scale-100" />
        </TabButton>
        <TabButton
          tabName="tab2"
          {...commonProps}
          {...getFloatingBoxHandlers({ content: "Config Preview" })}
        >
          <i className="gg-git-branch !scale-100" />
        </TabButton>
        <TabButton
          tabName="tab3"
          {...commonProps}
          {...getFloatingBoxHandlers({ content: "Viewing/Editing Mode" })}
        >
          <HiOutlineEye size={20} />
        </TabButton>

        <TabButton
          tabName="tab4"
          {...commonProps}
          {...getFloatingBoxHandlers({ content: "Notifications" })}
        >
          <MdNotificationsNone size={20} />
        </TabButton>
        <Controls />
        <a
          href="https://docs.setta.dev"
          target="_blank"
          className="focus-visible:ring-light-blue-500 absolute bottom-2 left-1 flex h-10 w-10 cursor-pointer items-center justify-center text-setta-400 hover:text-setta-600 focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-2 dark:text-setta-600 dark:hover:text-setta-500"
          rel="noreferrer"
        >
          <BiHelpCircle />
        </a>
      </div>
      <PaneContainer
        paneName={paneName}
        right={false}
        onResizeStop={onOverviewResizeStop}
        vis={vis}
        width={width}
        minimumWidth={250}
      >
        {vis && <TabsVisible tab={tab} />}
      </PaneContainer>
    </div>
  );
}

function TabsVisible({ tab }) {
  // const title = tabNameToPretty[tab];
  const title = {
    tab1: "Overview",
    tab2: "Project Configs",
    tab3: "View Modes",
    tab4: "Notifications",
  }[tab];
  return (
    <div
      className="mx-[1px] flex h-full min-h-0 w-[calc(100%_-_3rem)] min-w-0 flex-1
    flex-col overflow-hidden pl-1.5"
    >
      <h2 className="mb-1 cursor-pointer select-none text-xs font-bold uppercase tracking-tight text-setta-300 dark:text-setta-500">
        {title}
      </h2>
      <TabContent tab={tab} />
    </div>
  );
}

function TabContent({ tab }) {
  switch (tab) {
    case "tab1":
      return <ProjectOverview />;
    case "tab2":
      return <ProjectConfigs />;
    case "tab3":
      return <ViewingEditingMode />;
    case "tab4":
      return <NotificationsArea />;
  }
}
