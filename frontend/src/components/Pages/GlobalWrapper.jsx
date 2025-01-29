import { useEffect, useState } from "react";
import { Navigate, useLocation, useParams } from "react-router-dom";
import { dbGetDefaultConfigName } from "requests/projects";
import { dbLoadSettings } from "requests/settings";
import { openWebSocket, sendLocation } from "requests/websocket";
import { useProjectLoading, useSettings } from "state/definitions";
import { HOME_ROUTER_PATH, SETTINGS_ROUTER_PATH } from "utils/constants";

export function GlobalWrapper({ children }) {
  useOpenCloseWebsocket();
  useSetHTMLTitle();
  const settingsLoaded = useLoadSettings();
  return settingsLoaded && children;
}

export function IndexRouteComponent() {
  const showDefaultConfigOnLoad = useSettings(
    (x) => x.backend.showDefaultConfigOnLoad,
  );
  const defaultConfigName = useDefaultConfigName();
  if (defaultConfigName === undefined) {
    return null;
  }

  if (!showDefaultConfigOnLoad || defaultConfigName === null) {
    return <Navigate to={HOME_ROUTER_PATH} replace />;
  }

  return <Navigate to={defaultConfigName} replace />;
}

function useSetHTMLTitle() {
  const { pathname } = useLocation();
  const { projectConfigName } = useParams();
  const projectIs404 = useProjectLoading((x) => x.projectIs404);
  useEffect(() => {
    if (pathname === HOME_ROUTER_PATH) {
      document.title = "Home";
    } else if (pathname === SETTINGS_ROUTER_PATH) {
      document.title = "Settings";
    } else if (projectConfigName) {
      document.title = projectIs404 ? "Not Found" : projectConfigName;
    } else {
      document.title = "setta.dev";
    }
  }, [pathname, projectConfigName, projectIs404]);
}

function useOpenCloseWebsocket() {
  const location = useLocation();

  useEffect(() => {
    openWebSocket(location.pathname);
    sendLocation(location.pathname);
  }, [location.pathname]);
}

function useLoadSettings() {
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  async function fn() {
    const res = await dbLoadSettings();
    if (res.status === 200) {
      useSettings.setState(res.data);
    }
    setSettingsLoaded(true);
  }

  useEffect(() => {
    fn();
  }, []);

  return settingsLoaded;
}

function useDefaultConfigName() {
  const [defaultConfigName, setDefaultConfigName] = useState(undefined);

  async function fn() {
    const res = await dbGetDefaultConfigName();
    if (res.status === 200) {
      setDefaultConfigName(res.data);
    }
  }

  useEffect(() => {
    fn();
  }, []);

  return defaultConfigName;
}
