import {
  showParamUITypeTab,
  showProjectOverviewTab,
  showVersionsTab,
} from "components/Panes/paneFns";
import {
  copyFloatingBoxContent,
  copyFrozenFloatingBoxContent,
  decrementFloatingBoxIdx,
  decrementFrozenFloatingBoxIdx,
  disableFloatingBox,
  enableFloatingBox,
  freezeFloatingBox,
  getConvertFloatingBoxToSectionFn,
  incrementFloatingBoxIdx,
  incrementFrozenFloatingBoxIdx,
  removeFrozenFloatingBox,
} from "components/Utils/FloatingBox";
import { useDndState } from "forks/dnd-kit/dndState";
import {
  resetZoom,
  zoomIn,
  zoomOut,
} from "forks/xyflow/core/hooks/useViewportHelper";
import { useReactFlow } from "forks/xyflow/core/store";
import { onFitViewHandler } from "forks/xyflow/core/store/utils";
import { zoomToMouseLocation } from "forks/xyflow/core/utils/mouseLocation";
import _ from "lodash";
import { dbRestartLanguageServer } from "requests/lsp";
import {
  activateParamSelect,
  deactivateParamSelect,
} from "state/actions/paramSelect";
import { useSettings } from "state/definitions";
import { tabFromDocumentBody } from "utils/tabbingLogic";
import { isMacOs } from "utils/utils";
import {
  clearActiveSectionIds,
  selectAll,
  setTopLevelNonGroupSectionsAsActive,
} from "./activeSections";
import { copy } from "./copyPaste/copy";
import { paste } from "./copyPaste/paste";
import { formatCode } from "./interactive";
import { unselectAllParams } from "./kwargs";
import { openLoadModal, openSaveAsModal } from "./modal";
import { saveProject } from "./project/saveProject";
import {
  runOrImportActiveCode,
  runOrImportAllCode,
  sendProjectToAllInteractiveCode,
} from "./runOrImportCode";
import {
  addGroupInEmptySpace,
  addRegularSectionInEmptySpace,
  addTerminalInEmptySpace,
} from "./sections/createSections";
import { deleteAllActiveSections } from "./sections/deleteSections";
import { groupSections, ungroupActiveGroup } from "./sections/groupSections";
import {
  focusOnAdvancedSearch,
  focusOnSearch,
} from "./sections/sectionParamFilter";
import { redoProjectState, undoProjectState } from "./undo";

let keysPressed = new Set();
let keysPressedTimeStamps = new Map();
let aModShortcutWasPressed = false;

function resetKeysPressed() {
  keysPressed = new Set();
  keysPressedTimeStamps = new Map();
}

function deleteKeyPressed(key) {
  keysPressed.delete(key);
  keysPressedTimeStamps.delete(key);
}

function addKeyPressed(key) {
  keysPressed.add(key);
  keysPressedTimeStamps.set(key, Date.now());
}

function clearStaleKeys() {
  const now = Date.now();

  // First, collect all stale keys
  for (const [key, timestamp] of keysPressedTimeStamps) {
    if (now - timestamp > 100) {
      deleteKeyPressed(key);
    }
  }
}

function attachEventListenerAndReturnCleanup(attachTo, eventName, action) {
  attachTo.addEventListener(eventName, action);

  // Return a cleanup function
  return () => {
    attachTo.removeEventListener(eventName, action);
  };
}

function attachKeyDownListener(action) {
  return attachEventListenerAndReturnCleanup(document, "keydown", action);
}

function attachKeyUpListener(action) {
  return attachEventListenerAndReturnCleanup(document, "keyup", action);
}

const specialEventKeyToEventCode = {
  ".": "Period",
  ",": "Comma",
  "/": "Slash",
  "\\": "Backslash",
  "'": "Quote",
  ";": "Semicolon",
  "[": "BracketLeft",
  "]": "BracketRight",
  "-": "Minus",
  "=": "Equal",
  "`": "Backquote",
  // Adding case-sensitive keys
  arrowright: "ArrowRight",
  arrowleft: "ArrowLeft",
  arrowup: "ArrowUp",
  arrowdown: "ArrowDown",
};

const modifierKeyCodes = new Set([
  "MetaLeft",
  "MetaRight",
  "ControlLeft",
  "ControlRight",
  "AltLeft",
  "AltRight",
  "ShiftLeft",
  "ShiftRight",
]);

// shortcutString is a lowercase string.
function parseShortcut(shortcutString) {
  const parts = shortcutString.split("+").map((x) => x.trim());

  let keys = parts.filter((x) => !["ctrl", "shift", "alt", "mod"].includes(x));

  keys = new Set(
    keys.map((part) => {
      const x = part.trim();
      if (/^[a-zA-Z]$/.test(x)) {
        return `Key${x.toUpperCase()}`;
      }
      if (/^[0-9]$/.test(x)) {
        return `Digit${x}`;
      }
      const special = specialEventKeyToEventCode[x];
      return special ?? x[0].toUpperCase() + x.slice(1);
    }),
  );

  return {
    mod: parts.includes("mod"),
    ctrl: parts.includes("ctrl"),
    shift: parts.includes("shift"),
    alt: parts.includes("alt"),
    keys,
  };
}

function isShortcutPressed(e, parsedShortcut, _isMacOs) {
  const { mod, ctrl, shift, alt, keys } = parsedShortcut;
  if (_isMacOs) {
    return (
      e.metaKey === mod &&
      e.ctrlKey === ctrl &&
      e.shiftKey === shift &&
      e.altKey === alt &&
      _.isEqual(keysPressed, keys)
    );
  } else {
    return (
      e.ctrlKey === (ctrl || mod) &&
      e.shiftKey === shift &&
      e.altKey === alt &&
      _.isEqual(keysPressed, keys)
    );
  }
}

function keysMatch(keys, targetKeyList) {
  return _.isEqual(keys, new Set(targetKeyList));
}

function isModOrCtrlPlus(parsedShortcut, targetKeyList) {
  const { mod, ctrl, shift, alt, keys } = parsedShortcut;
  return (ctrl || mod) && !shift && !alt && keysMatch(keys, targetKeyList);
}

function isModOrCtrlShiftPlus(parsedShortcut, targetKeyList) {
  const { mod, ctrl, shift, alt, keys } = parsedShortcut;
  return (ctrl || mod) && shift && !alt && keysMatch(keys, targetKeyList);
}

function isCtrlPlus(parsedShortcut, targetKeyList) {
  const { mod, ctrl, shift, alt, keys } = parsedShortcut;
  return ctrl && !mod && !shift && !alt && keysMatch(keys, targetKeyList);
}

function isModPlus(parsedShortcut, targetKeyList) {
  const { mod, ctrl, shift, alt, keys } = parsedShortcut;
  return mod && !ctrl && !shift && !alt && keysMatch(keys, targetKeyList);
}

function isModShiftPlus(parsedShortcut, targetKeyList) {
  const { mod, ctrl, shift, alt, keys } = parsedShortcut;
  return mod && shift && !ctrl && !alt && keysMatch(keys, targetKeyList);
}

function isOptionPlus(parsedShortcut, targetKeyList) {
  const { mod, ctrl, shift, alt, keys } = parsedShortcut;
  return alt && !shift && !ctrl && !mod && keysMatch(keys, targetKeyList);
}

function isOptionShiftPlus(parsedShortcut, targetKeyList) {
  const { mod, ctrl, shift, alt, keys } = parsedShortcut;
  return alt && shift && !ctrl && !mod && keysMatch(keys, targetKeyList);
}

function isShiftPlus(parsedShortcut, targetKeyList) {
  const { mod, ctrl, shift, alt, keys } = parsedShortcut;
  return shift && !alt && !ctrl && !mod && keysMatch(keys, targetKeyList);
}

function isModCtrlPlus(parsedShortcut, targetKeyList) {
  const { mod, ctrl, shift, alt, keys } = parsedShortcut;
  return mod && ctrl && !alt && !shift && keysMatch(keys, targetKeyList);
}

function getShouldPreventDefault(parsedShortcut) {
  const { mod, ctrl, shift, alt, keys } = parsedShortcut;

  // case for shortcuts that don't contain modifiers
  if (!mod && !ctrl && !shift && !alt) {
    return false;
  }

  // case for "mod", "ctrl", "alt", "shift"
  if (keys.size === 0) {
    return false;
  }

  // special shortcuts
  if (
    isModOrCtrlPlus(parsedShortcut, ["KeyC"]) ||
    isModOrCtrlPlus(parsedShortcut, "KeyV") ||
    isShiftPlus(parsedShortcut, ["Tab"])
  ) {
    return false;
  }

  return true;
}

function getIsInput(event) {
  return (
    event.target instanceof HTMLInputElement ||
    event.target instanceof HTMLTextAreaElement ||
    event.target instanceof HTMLSelectElement ||
    event.target.isContentEditable
  );
}

function getMacosIgnoreWhenInInputField(parsedShortcut) {
  const { mod, shift, ctrl, alt } = parsedShortcut;
  return (
    (!mod && !shift && !ctrl && !alt) ||
    isShiftPlus(parsedShortcut, []) ||
    isModPlus(parsedShortcut, []) ||
    isModPlus(parsedShortcut, ["KeyC"]) || // Copy selected text.
    isModPlus(parsedShortcut, ["KeyV"]) || // Paste text from the clipboard.
    isModPlus(parsedShortcut, ["KeyX"]) || // Cut selected text.
    isModPlus(parsedShortcut, ["KeyZ"]) || // Undo the last action.
    isModShiftPlus(parsedShortcut, ["KeyZ"]) || // Redo the last undone action.
    isModPlus(parsedShortcut, ["KeyA"]) || // Select all text in the field.
    isModPlus(parsedShortcut, ["ArrowLeft"]) || // Move cursor to the beginning of the line.
    isModPlus(parsedShortcut, ["ArrowRight"]) || // Move cursor to the end of the line.
    isOptionPlus(parsedShortcut, ["ArrowLeft"]) || // Move cursor to the previous word.
    isOptionPlus(parsedShortcut, ["ArrowRight"]) || // Move cursor to the next word.
    isShiftPlus(parsedShortcut, ["ArrowLeft"]) || // Extend selection one character to the left.
    isShiftPlus(parsedShortcut, ["ArrowRight"]) || // Extend selection one character to the right.
    isShiftPlus(parsedShortcut, ["ArrowUp"]) || // Extend selection one line up.
    isShiftPlus(parsedShortcut, ["ArrowDown"]) || // Extend selection one line down.
    isOptionShiftPlus(parsedShortcut, ["ArrowLeft"]) || // Extend selection to the previous word.
    isOptionShiftPlus(parsedShortcut, ["ArrowRight"]) || // Extend selection to the next word.
    isModShiftPlus(parsedShortcut, ["ArrowLeft"]) || // Extend selection to the beginning of the line.
    isModShiftPlus(parsedShortcut, ["ArrowRight"]) || // Extend selection to the end of the line.
    isOptionPlus(parsedShortcut, ["Backspace"]) || // Delete the word to the left of the cursor.
    isModPlus(parsedShortcut, ["Backspace"]) || // Delete from the cursor to the beginning of the line.
    isCtrlPlus(parsedShortcut, ["KeyA"]) || // Move cursor to the beginning of the line.
    isCtrlPlus(parsedShortcut, ["KeyE"]) || // Move cursor to the end of the line.
    isCtrlPlus(parsedShortcut, ["KeyF"]) || // Move cursor forward one character.
    isCtrlPlus(parsedShortcut, ["KeyB"]) || // Move cursor backward one character.
    isCtrlPlus(parsedShortcut, ["KeyN"]) || // Move cursor down one line.
    isCtrlPlus(parsedShortcut, ["KeyP"]) || // Move cursor up one line.
    isCtrlPlus(parsedShortcut, ["KeyD"]) || // Delete the character ahead of the cursor.
    isCtrlPlus(parsedShortcut, ["KeyH"]) || // Delete the character behind the cursor.
    isCtrlPlus(parsedShortcut, ["KeyT"]) || // Transpose the characters on either side of the cursor.
    isModCtrlPlus(parsedShortcut, ["Space"]) || // Open the Emoji & Symbols palette.
    isModShiftPlus(parsedShortcut, ["KeyV"]) || // Paste and match style (paste without formatting).
    isModPlus(parsedShortcut, ["ArrowUp"]) || // Move cursor to document start
    isModPlus(parsedShortcut, ["ArrowDown"]) || // Move cursor to document end
    isModShiftPlus(parsedShortcut, ["ArrowUp"]) || // Extend selection to document start
    isModShiftPlus(parsedShortcut, ["ArrowDown"]) || // Extend selection to document end
    isModPlus(parsedShortcut, ["KeyY"]) || // Redo (alternative to Cmd+Shift+Z)
    isModPlus(parsedShortcut, ["KeyB"]) || // Bold text
    isModPlus(parsedShortcut, ["KeyI"]) // Italic text
  );
}

function getWindowsIgnoreWhenInInputField(parsedShortcut) {
  const { mod, shift, ctrl, alt } = parsedShortcut;
  return (
    (!mod && !shift && !ctrl && !alt) ||
    isShiftPlus(parsedShortcut, []) ||
    isModPlus(parsedShortcut, []) ||
    isModOrCtrlPlus(parsedShortcut, ["KeyA"]) || // Select all text
    isModOrCtrlPlus(parsedShortcut, ["KeyC"]) || // Copy selected text
    isModOrCtrlPlus(parsedShortcut, ["KeyV"]) || // Paste text from the clipboard
    isModOrCtrlPlus(parsedShortcut, ["KeyX"]) || // Cut selected text
    isModOrCtrlPlus(parsedShortcut, ["KeyZ"]) || // Undo the last action
    isModOrCtrlPlus(parsedShortcut, ["KeyY"]) || // Redo the last undone action
    isModOrCtrlPlus(parsedShortcut, ["ArrowLeft"]) || // Move the cursor to the beginning of the previous word
    isModOrCtrlPlus(parsedShortcut, ["ArrowRight"]) || // Move the cursor to the beginning of the next word
    isShiftPlus(parsedShortcut, ["ArrowLeft"]) || // Extend selection one character to the left
    isShiftPlus(parsedShortcut, ["ArrowRight"]) || // Extend selection one character to the right
    isModOrCtrlShiftPlus(parsedShortcut, ["ArrowLeft"]) || // Extend selection to include the previous word
    isModOrCtrlShiftPlus(parsedShortcut, ["ArrowRight"]) || // Extend selection to include the next word
    isModOrCtrlPlus(parsedShortcut, ["ArrowUp"]) || // Move cursor to beginning of paragraph/section
    isModOrCtrlPlus(parsedShortcut, ["ArrowDown"]) || // Move cursor to end of paragraph/section
    isModOrCtrlShiftPlus(parsedShortcut, ["ArrowUp"]) || // Extend selection to beginning of paragraph
    isModOrCtrlShiftPlus(parsedShortcut, ["ArrowDown"]) || // Extend selection to end of paragraph
    isShiftPlus(parsedShortcut, ["ArrowUp"]) || // Extend selection one line up
    isShiftPlus(parsedShortcut, ["ArrowDown"]) || // Extend selection one line down
    isOptionPlus(parsedShortcut, ["ArrowLeft"]) || // Move cursor one word left (alternative to Ctrl+Left)
    isOptionPlus(parsedShortcut, ["ArrowRight"]) || // Move cursor one word right (alternative to Ctrl+Right)
    isModOrCtrlPlus(parsedShortcut, ["KeyK"]) || // Create/follow link (in rich text editors)
    isShiftPlus(parsedShortcut, ["Home"]) || // Select text from the cursor to the beginning of the line
    isShiftPlus(parsedShortcut, ["End"]) || // Select text from the cursor to the end of the line
    isModOrCtrlPlus(parsedShortcut, ["Home"]) || // Move the cursor to the beginning of the text field
    isModOrCtrlPlus(parsedShortcut, ["End"]) || // Move the cursor to the end of the text field
    isModOrCtrlShiftPlus(parsedShortcut, ["Home"]) || // Select text from the cursor to the beginning of the text field
    isModOrCtrlShiftPlus(parsedShortcut, ["End"]) || // Select text from the cursor to the end of the text field
    isModOrCtrlPlus(parsedShortcut, ["Backspace"]) || // Delete the word before the cursor
    isModOrCtrlPlus(parsedShortcut, ["Delete"]) || // Delete the word after the cursor
    isShiftPlus(parsedShortcut, ["Enter"]) || // Insert a new line without submitting
    isModOrCtrlShiftPlus(parsedShortcut, ["KeyV"]) || // Paste without formatting
    isModOrCtrlPlus(parsedShortcut, ["KeyB"]) || // Bold text (in rich text editors)
    isModOrCtrlPlus(parsedShortcut, ["KeyI"]) || // Italicize text (in rich text editors)
    isModOrCtrlPlus(parsedShortcut, ["KeyU"]) // Underline text (in rich text editors)
  );
}

function getIgnoreWhenInInputField(parsedShortcut, _isMacOs) {
  return _isMacOs
    ? getMacosIgnoreWhenInInputField(parsedShortcut)
    : getWindowsIgnoreWhenInInputField(parsedShortcut);
}

function keyUpLoop(e, shortcutInfo) {
  for (const x of shortcutInfo) {
    if (x.wasPressed && !x.keepKeyDownCondition?.(e)) {
      x.wasPressed = false;
      x.keyUpAction?.(e);
    }
  }
}

function addKeepKeyDownConditions(sInfo, _isMacOs) {
  // post processing that depends on parsed shortcuts
  sInfo.showTooltipShortcut.keepKeyDownCondition = (e) =>
    isShortcutPressed(e, sInfo.showTooltipShortcut.parsedShortcut, _isMacOs) ||
    isShortcutPressed(
      e,
      sInfo.incrementTooltipPageShortcut.parsedShortcut,
      _isMacOs,
    ) ||
    isShortcutPressed(
      e,
      sInfo.decrementTooltipPageShortcut.parsedShortcut,
      _isMacOs,
    ) ||
    isShortcutPressed(
      e,
      sInfo.copyTooltipTextShortcut.parsedShortcut,
      _isMacOs,
    );
}

export function attachKeyEventListeners() {
  const shortcuts = useSettings.getState().shortcuts;
  const shortcutsNeededForExtraProcessing = {};

  function addToShortcutsNeededForExtraProcessing(
    name,
    keyDownAction,
    keyUpAction = null,
    allowRepeat = false,
  ) {
    const output = [
      shortcuts[name],
      keyDownAction,
      keyUpAction,
      allowRepeat,
      name,
    ];
    shortcutsNeededForExtraProcessing[name] = output;
    return output;
  }

  const conditionAndAction = [
    ["tab", tabFromDocumentBody],
    ["shift + tab", tabFromDocumentBody],
    [shortcuts.newCardShortcut, addRegularSectionInEmptySpace],
    [shortcuts.newGroupShortcut, addGroupInEmptySpace],
    [shortcuts.newTerminalShortcut, addTerminalInEmptySpace],
    addToShortcutsNeededForExtraProcessing(
      "showTooltipShortcut",
      enableFloatingBox,
      disableFloatingBox,
    ),
    [
      shortcuts.tooltipToPlaintextShortcut,
      getConvertFloatingBoxToSectionFn(false),
    ],
    [
      shortcuts.tooltipToMarkdownShortcut,
      getConvertFloatingBoxToSectionFn(true),
    ],
    [shortcuts.freezeTooltipShortcut, freezeFloatingBox],
    [
      shortcuts.frozenTooltipToPlaintextShortcut,
      getConvertFloatingBoxToSectionFn(false),
    ],
    [
      shortcuts.frozenTooltipToMarkdownShortcut,
      getConvertFloatingBoxToSectionFn(true),
    ],
    addToShortcutsNeededForExtraProcessing(
      "incrementTooltipPageShortcut",
      incrementFloatingBoxIdx,
    ),
    addToShortcutsNeededForExtraProcessing(
      "decrementTooltipPageShortcut",
      decrementFloatingBoxIdx,
    ),
    addToShortcutsNeededForExtraProcessing(
      "copyTooltipTextShortcut",
      copyFloatingBoxContent,
    ),
    [shortcuts.frozenTooltipIncrementShortcut, incrementFrozenFloatingBoxIdx],
    [shortcuts.frozenTooltipDecrementShortcut, decrementFrozenFloatingBoxIdx],
    [shortcuts.frozenTooltipCopyShortcut, copyFrozenFloatingBoxContent],
    [shortcuts.undoShortcut, undoProjectState, null, true],
    [shortcuts.redoShortcut, redoProjectState, null, true],
    [shortcuts.groupShortcut, groupSections],
    [shortcuts.ungroupShortcut, ungroupActiveGroup],
    [shortcuts.saveShortcut, saveProject],
    [shortcuts.loadShortcut, openLoadModal],
    [shortcuts.saveAsShortcut, openSaveAsModal],
    [shortcuts.searchShortcut, focusOnSearch],
    [shortcuts.advancedSearchShortcut, focusOnAdvancedSearch],
    [shortcuts.resetZoomShortcut, resetZoom],
    [shortcuts.copyShortcut, copy],
    [shortcuts.pasteShortcut, paste],
    [shortcuts.pasteAsRefShortcut, () => paste({ asRef: true })],
    [shortcuts.runCodeShortcut, runOrImportActiveCode],
    [shortcuts.runAllCodeShortcut, runOrImportAllCode],
    [
      shortcuts.sendProjectToAllInteractiveCode,
      sendProjectToAllInteractiveCode,
    ],
    [shortcuts.formatCode, formatCode],
    [shortcuts.paramSelect, activateParamSelect, deactivateParamSelect],
    [shortcuts.fitViewShortcut, onFitViewHandler],
    [shortcuts.zoomToMouseShortcut, zoomToMouseLocation],
    [shortcuts.deleteSectionShortcut, deleteAllActiveSections],
    [
      shortcuts.selectTopLevelNonGroupSections,
      setTopLevelNonGroupSectionsAsActive,
    ],
    [shortcuts.selectAll, selectAll],
    [shortcuts.showVersionsTabShortcut, showVersionsTab],
    [shortcuts.showParamUITypeTabShortcut, showParamUITypeTab],
    [shortcuts.showProjectOverviewTabShortcut, showProjectOverviewTab],
    [shortcuts.zoomInShortcut, zoomIn, null, true],
    [shortcuts.zoomOutShortcut, zoomOut, null, true],
    [shortcuts.restartLanguageServerShortcut, dbRestartLanguageServer],
    [
      shortcuts.selectionKeyCode,
      activateSelectionKeyPressed,
      deactivateSelectionKeyPressed,
    ],
    [
      shortcuts.multiSelectionKeyCode,
      activateMultiSelectionPressed,
      deactivateMultiSelectionPressed,
    ],
    [shortcuts.panActivationKeyCode, activatePanMode, deactivatePanMode],
    [shortcuts.zoomActivationKeyCode, activateZoomMode, deactivateZoomMode],
    [
      shortcuts.moveSectionKeyCode,
      activateMoveSectionMode,
      deactivateMoveSectionMode,
    ],
    [
      shortcuts.sortingShortcut,
      useDndState.getState().activateSortingMode,
      useDndState.getState().deactivate,
    ],
    [
      shortcuts.movingFreeShortcut,
      useDndState.getState().activateMovingFreeMode,
      useDndState.getState().deactivate,
    ],
    ["Escape", onEscapeKey],
  ];

  const cleanup_functions = [];
  const shortcutInfo = [];
  const _isMacOs = isMacOs();
  for (const [
    keyCombo,
    keyDownAction,
    keyUpAction,
    allowRepeat,
    nameForExtraProcessing,
  ] of conditionAndAction) {
    if (!keyCombo) {
      continue;
    }

    const lowercaseKeyCombo = keyCombo.toLowerCase();
    const parsedShortcut = parseShortcut(lowercaseKeyCombo);
    const info = {
      parsedShortcut,
      wasPressed: false,
      shouldPreventDefault: getShouldPreventDefault(parsedShortcut),
      keyDownAction,
      keyUpAction,
      allowRepeat,
      ignoreWhenInInputField: getIgnoreWhenInInputField(
        parsedShortcut,
        _isMacOs,
      ),
    };
    shortcutInfo.push(info);
    if (shortcutsNeededForExtraProcessing[nameForExtraProcessing]) {
      shortcutsNeededForExtraProcessing[nameForExtraProcessing] = info;
    }
  }

  addKeepKeyDownConditions(shortcutsNeededForExtraProcessing, _isMacOs);

  let cleanup = attachKeyDownListener((e) => {
    // need to clear keys by timestamp because keyup does not trigger on mac when cmd key is held down
    if (aModShortcutWasPressed) {
      clearStaleKeys();
    }
    aModShortcutWasPressed = false;
    if (!modifierKeyCodes.has(e.code)) {
      addKeyPressed(e.code);
    }
    const isInput = getIsInput(e);

    for (const x of shortcutInfo) {
      if (isShortcutPressed(e, x.parsedShortcut, _isMacOs)) {
        if (x.ignoreWhenInInputField && isInput) {
          continue;
        }
        if (x.shouldPreventDefault) {
          e.preventDefault();
        }
        if (e.repeat && !x.allowRepeat) {
          continue;
        }
        x.keyDownAction(e);
        x.wasPressed = true;
        if (x.parsedShortcut.mod) {
          aModShortcutWasPressed = true;
        }
      } else if (x.wasPressed && !x.keepKeyDownCondition?.(e)) {
        x.keyUpAction?.(e);
        x.wasPressed = false;
      }
    }
  });
  cleanup_functions.push(cleanup);

  cleanup = attachKeyUpListener((e) => {
    if (_isMacOs && e.key === "Meta") {
      // special case because on mac, meta key causes the other pressed keys to not trigger keyup
      resetKeysPressed();
    } else {
      deleteKeyPressed(e.code);
    }
    keyUpLoop(e, shortcutInfo);
  });
  cleanup_functions.push(cleanup);

  cleanup = attachEventListenerAndReturnCleanup(window, "blur", (e) => {
    resetKeysPressed();
    keyUpLoop(e, shortcutInfo);
  });
  cleanup_functions.push(cleanup);

  if (_isMacOs) {
    cleanup = specialModTabCase(shortcutInfo);
    if (cleanup) {
      cleanup_functions.push(cleanup);
    }
  }

  return () => {
    cleanup_functions.forEach((x) => x());
  };
}

// When you do mod + tab in macos, but change your mind and don't change programs
// neither blur nor keyup get triggered. So shortcuts that consist of just "mod"
// never call their keyup action.
// The workaround here is to detect mouse movement
// (something the user will almost certainly do if they don't press any keys),
// and if metaKey is false, then call the keyup actions if necessary.
// If the user doesn't move the mouse, then they'll probably press a key, in which case
// the keyup action will be called in the keydown listener (since wasPressed is true).
function specialModTabCase(shortcutInfo) {
  const modShortcuts = shortcutInfo.filter((x) => x.parsedShortcut.mod);
  if (modShortcuts.length > 0) {
    const cleanup = attachEventListenerAndReturnCleanup(
      window,
      "mousemove",
      (e) => {
        if (aModShortcutWasPressed && !e.metaKey) {
          modShortcuts.forEach((x) => {
            if (x.wasPressed) {
              x.keyUpAction?.(e);
              x.wasPressed = false;
            }
          });
          aModShortcutWasPressed = false;
        }
      },
    );
    return cleanup;
  }
}

function onEscapeKey() {
  const didUnselectSomeParams = unselectAllParams();
  if (!didUnselectSomeParams) {
    clearActiveSectionIds();
  }
  removeFrozenFloatingBox();
}

function activateSelectionKeyPressed() {
  useReactFlow.setState({ selectionKeyPressed: true });
}

function deactivateSelectionKeyPressed() {
  useReactFlow.setState({ selectionKeyPressed: false });
}

function activateMultiSelectionPressed() {
  useReactFlow.setState({ multiSelectionActive: true });
}

function deactivateMultiSelectionPressed() {
  useReactFlow.setState({ multiSelectionActive: false });
}

function activatePanMode() {
  useReactFlow.setState({ panActivationKeyPressed: true });
}

function deactivatePanMode() {
  useReactFlow.setState({ panActivationKeyPressed: false });
}

function activateZoomMode() {
  useReactFlow.setState({ zoomActivationKeyPressed: true });
}

function deactivateZoomMode() {
  useReactFlow.setState({ zoomActivationKeyPressed: false });
}

function activateMoveSectionMode() {
  useReactFlow.setState({ moveSectionActivationKeyPressed: true });
}

function deactivateMoveSectionMode() {
  useReactFlow.setState({ moveSectionActivationKeyPressed: false });
}
