import { useProjectLoading } from "state/definitions";
import { HOME_ROUTER_PATH, PROJECT_CONFIG_ROUTER_PATH } from "utils/constants";
import { DarkModeSwitch } from "./DarkModeSwitch";
import { Notification } from "./Notification";
import { ProjectNav } from "./ProjectNav";
import { HomePageSearchBar } from "./SearchBar/HomePageSearch";
import { ProjectPageSearchBar } from "./SearchBar/ProjectPageSearch";
import { SiteLogo } from "./SiteLogo";

export function HeaderContainer({ path }) {
  const projectIs404 = useProjectLoading((x) => x.projectIs404);
  return (
    <header
      className={`z-20 flex h-12 min-h-12 w-[100vw] flex-row items-center border-b border-transparent bg-white px-4 shadow-md dark:border-setta-700/30 dark:bg-setta-875 `}
    >
      <SiteLogo />
      {!projectIs404 && (
        <>
          <ProjectNav />
          <SearchSwitch path={path} />
          <Notification />
        </>
      )}
      <DarkModeSwitch />
    </header>
  );
}

function SearchSwitch({ path }) {
  switch (path) {
    case HOME_ROUTER_PATH:
      return <HomePageSearchBar />;
    case PROJECT_CONFIG_ROUTER_PATH:
      return <ProjectPageSearchBar />;
    default:
      return null;
  }
}
