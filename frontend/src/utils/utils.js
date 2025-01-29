import C from "constants/constants.json";
import { arrayMove } from "forks/dnd-kit/CustomSortable";
import _ from "lodash";

export const isMacOs = () =>
  typeof navigator !== "undefined" && navigator?.userAgent?.indexOf("Mac") >= 0;

export function clamp(number, min, max) {
  return Math.max(min, Math.min(number, max));
}

// https://stackoverflow.com/a/38181008
// create new array with inserted value (no mutation)
export function insertIntoArray(arr, index, ...newItems) {
  return [
    // part of the array before the specified index
    ...arr.slice(0, index),
    // inserted items
    ...newItems,
    // part of the array after the specified index
    ...arr.slice(index),
  ];
}

export function updateWithArrayMove(active, over) {
  return (x) => {
    const activeIndex = x.indexOf(active.id);
    const overIndex = x.indexOf(over.id);
    return arrayMove(x, activeIndex, overIndex);
  };
}

export function bothTruthyOrFalsey(a, b) {
  return !a === !b || a === b;
}

export function asyncDebounce(func, wait) {
  const debounced = _.debounce((resolve, reject, args) => {
    func(...args)
      .then(resolve)
      .catch(reject);
  }, wait);
  return (...args) =>
    new Promise((resolve, reject) => {
      debounced(resolve, reject, args);
    });
}

export function tryParseJSON(x) {
  try {
    return JSON.parse(x);
  } catch {
    return x;
  }
}

export function shortcutPrettified(shortcut) {
  // macOS command symbol (⌘)
  const macSymbol = "⌘";
  const windowsText = "Ctrl";

  // Create a case-insensitive regular expression to match "mod"
  const modRegex = /mod/gi;

  // Replace all occurrences of "mod" (case-insensitive) with the appropriate symbol
  return shortcut.replace(modRegex, isMacOs() ? macSymbol : windowsText);
}

export function shortcutCodemirrorFormat(shortcut) {
  // Remove all spaces and split by '+'
  const parts = shortcut.replace(/\s+/g, "").split("+");

  // Convert single-character parts to lowercase, leave others unchanged
  const convertedParts = parts.map((part) =>
    part.length === 1 ? part.toLowerCase() : part,
  );

  // Join back with '-'
  return convertedParts.join("-");
}

export function dummyRegExpObject() {
  return {
    exec: function () {
      return null;
    },
  };
}

export function templatePrefix(x) {
  return `${C.TEMPLATE_PREFIX}${x}`;
}

export function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function positiveMod(n, m) {
  return ((n % m) + m) % m;
}
