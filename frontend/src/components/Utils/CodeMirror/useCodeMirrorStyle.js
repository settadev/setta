import { tags as t } from "@lezer/highlight";
import {
  defaultSettingsGithubDark,
  defaultSettingsGithubLight,
  githubDarkInit,
  githubLightInit,
} from "@uiw/codemirror-theme-github";
import { createTheme } from "@uiw/codemirror-themes";
import { localStorageFns } from "state/hooks/localStorage";

const commonSettings = {
  background: "#ffffff00",
  gutterBackground: "#FFFFFF00",
  // fontFamily:
  //   "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;",
  // gutterForeground: "#4D4D4C00",
  gutterBorder: "#dddddd00",
};

function boringTheme(darkMode, color) {
  const defaultSettingsGithub = darkMode
    ? defaultSettingsGithubDark
    : defaultSettingsGithubLight;
  return createTheme({
    theme: darkMode ? "dark" : "light",
    settings: { ...defaultSettingsGithub, ...commonSettings },
    styles: [
      { tag: [t.comment, t.bracket], color },
      { tag: t.variableName, color },
      { tag: [t.string, t.special(t.brace)], color },
      { tag: t.number, color },
      { tag: t.bool, color },
      { tag: t.null, color },
      { tag: t.keyword, color },
      { tag: t.operator, color },
      { tag: t.className, color },
      { tag: t.definition(t.typeName), color },
      { tag: t.typeName, color },
      { tag: t.angleBracket, color },
      { tag: t.tagName, color },
      { tag: t.attributeName, color },
    ],
  });
}

const githubDarkTheme = githubDarkInit({
  settings: commonSettings,
});

const githubLightTheme = githubLightInit({
  settings: commonSettings,
});

const greenDarkTheme = boringTheme(true, "#7ee787");
const greenLightTheme = boringTheme(false, "hsla(157, 100%, 28%, 1)");

export function useCodeMirrorStyle(color) {
  const [darkMode] = localStorageFns.darkMode.hook();
  return getCodeMirrorStyle(darkMode, color);
}

export function getCodeMirrorStyle(darkMode, color) {
  if (color === "green") {
    return darkMode ? greenDarkTheme : greenLightTheme;
  }
  return darkMode ? githubDarkTheme : githubLightTheme;
}
