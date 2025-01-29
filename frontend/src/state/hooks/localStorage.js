import React from "react";
import {
  CLOSED_PANE_WIDTH,
  INITIAL_OVERVIEW_WIDTH,
  INITIAL_UI_EDITOR_WIDTH,
} from "utils/constants";

export const localStorageFns = {
  snapToGrid: { init: true },
  darkMode: { init: true },
  showMinimap: { init: true },
  projectConfigPreviewEnabled: { init: true },
  overviewVis: { init: true },
  overviewWidth: { init: INITIAL_OVERVIEW_WIDTH },
  overviewTrueWidth: { init: INITIAL_OVERVIEW_WIDTH },
  overviewTab: { init: "tab1" },
  uiEditorVis: { init: false },
  uiEditorWidth: { init: INITIAL_UI_EDITOR_WIDTH },
  uiEditorTrueWidth: { init: CLOSED_PANE_WIDTH },
  uiEditorTab: { init: {} },
  showNavBarHelpMessage: { init: true },
};

for (const [k, v] of Object.entries(localStorageFns)) {
  localStorageFns[k].hook = () => useLocalStorage(k, v.init);
  localStorageFns[k].state = () => localStorageState(k);
}

function localStorageState(key) {
  const x = JSON.parse(getLocalStorageItem(key));
  const setX = (value) => {
    setLocalStorageItem(key, value);
  };
  return [x, setX];
}

function getActualKey(key) {
  return `setta_data_${key}`;
}

////////////////////////////////////////
//https://github.com/uidotdev/usehooks//
////////////////////////////////////////

function dispatchStorageEvent(key, newValue) {
  window.dispatchEvent(new StorageEvent("storage", { key, newValue }));
}

const setLocalStorageItem = (key, value) => {
  const actualKey = getActualKey(key);
  let actualValue = value;
  if (typeof value === "function") {
    actualValue = value(JSON.parse(window.localStorage.getItem(actualKey)));
  }

  const stringifiedValue = JSON.stringify(actualValue);
  window.localStorage.setItem(actualKey, stringifiedValue);
  dispatchStorageEvent(actualKey, stringifiedValue);
};

const removeLocalStorageItem = (key) => {
  const actualKey = getActualKey(key);
  window.localStorage.removeItem(actualKey);
  dispatchStorageEvent(actualKey, null);
};

const getLocalStorageItem = (key) => {
  const actualKey = getActualKey(key);
  return window.localStorage.getItem(actualKey);
};

const useLocalStorageSubscribe = (callback) => {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
};

const getLocalStorageServerSnapshot = () => {
  throw Error("useLocalStorage is a client-only hook");
};

function useLocalStorage(key, initialValue) {
  const getSnapshot = () => getLocalStorageItem(key);

  const store = React.useSyncExternalStore(
    useLocalStorageSubscribe,
    getSnapshot,
    getLocalStorageServerSnapshot,
  );

  const setState = React.useCallback(
    (v) => {
      try {
        const nextState = typeof v === "function" ? v(JSON.parse(store)) : v;

        if (nextState === undefined || nextState === null) {
          removeLocalStorageItem(key);
        } else {
          setLocalStorageItem(key, nextState);
        }
      } catch (e) {
        console.warn(e);
      }
    },
    [key, store],
  );

  React.useEffect(() => {
    if (
      getLocalStorageItem(key) === null &&
      typeof initialValue !== "undefined"
    ) {
      setLocalStorageItem(key, initialValue);
    }
  }, [key, initialValue]);

  return [store ? JSON.parse(store) : initialValue, setState];
}
