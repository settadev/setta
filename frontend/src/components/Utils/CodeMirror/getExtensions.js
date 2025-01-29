import {
  acceptCompletion,
  autocompletion,
  completionStatus,
} from "@codemirror/autocomplete";
import { indentLess, indentMore } from "@codemirror/commands";
import { javascript } from "@codemirror/lang-javascript";
import { json } from "@codemirror/lang-json";
import { markdown } from "@codemirror/lang-markdown";
import { python } from "@codemirror/lang-python";
import { yaml } from "@codemirror/lang-yaml";
import { EditorState, Prec } from "@codemirror/state";
import { keymap, tooltips } from "@codemirror/view";
import { EditorView } from "@uiw/react-codemirror";
import { redoProjectState, undoProjectState } from "state/actions/undo";
import { useSettings } from "state/definitions";
import { shortcutCodemirrorFormat } from "utils/utils";

export function getExtensions({
  sectionId,
  language,
  completionsFn,
  keywordStylizer,
  singleLine,
  tabToAutocomplete,
  indentWithTab,
  onTab,
  onEscape,
  keyComboActions,
  isDisabled,
}) {
  const extensions = [
    EditorView.lineWrapping,
    tooltips({
      parent: document.getElementById(`${sectionId}-CustomResizable`),
    }),
  ];

  if (language === "python") {
    extensions.push(python());
  } else if (language === "javascript") {
    extensions.push(javascript());
  } else if (language === "yaml") {
    extensions.push(yaml());
  } else if (language === "json") {
    extensions.push(json());
  } else if (language === "markdown") {
    extensions.push(markdown());
  }

  // autocomplete
  if (completionsFn) {
    extensions.push(
      autocompletion({
        override: [completionsFn],
        tooltipClass: () => "nowheel",
      }),
    );
  }

  if (keywordStylizer) {
    extensions.push(keywordStylizer);
  }

  if (singleLine) {
    extensions.push(
      EditorState.transactionFilter.of((tr) => (tr.newDoc.lines > 1 ? [] : tr)),
    );
  }

  if (isDisabled) {
    extensions.push(EditorState.readOnly.of(true));
  }

  extensions.push(
    Prec.highest(
      keymap.of(
        getKeyMapArray({
          indentWithTab,
          tabToAutocomplete,
          onTab,
          onEscape,
          keyComboActions,
        }),
      ),
    ),
  );

  return extensions;
}

function getKeyMapArray({
  indentWithTab,
  tabToAutocomplete,
  onTab,
  onEscape,
  keyComboActions,
}) {
  const settings = useSettings.getState();

  // we call undo and redo here because in keyActivations,
  // undo/redo are disabled in input fields.
  // But at the same time, we want to override codemirror's undo/redo
  const keymapArray = [
    {
      key: shortcutCodemirrorFormat(settings.shortcuts.undoShortcut),
      run: () => {
        undoProjectState();
        return true;
      },
    },
    {
      key: shortcutCodemirrorFormat(settings.shortcuts.redoShortcut),
      run: () => {
        redoProjectState();
        return true;
      },
    },
    {
      key: shortcutCodemirrorFormat(settings.shortcuts.runCodeShortcut),
      run: () => true,
    },
    {
      key: shortcutCodemirrorFormat(settings.shortcuts.runAllCodeShortcut),
      run: () => true,
    },
    {
      key: "Escape",
      run: (view) => {
        if (onEscape) {
          const expectingCompletions = completionStatus(view.state);
          onEscape(expectingCompletions);
        }
      },
    },
  ];

  if (indentWithTab) {
    keymapArray.push({
      key: "Shift-Tab",
      // if tab controls indent, then always prevent default and stop propagation
      preventDefault: true,
      stopPropagation: true,
      run: (view) => {
        indentLess(view);
      },
    });
  }

  if (tabToAutocomplete || indentWithTab) {
    keymapArray.push({
      key: "Tab",
      preventDefault: false, // we want to control when preventDefault (and therefore also stopPropagation) is called
      stopPropagation: true,
      run: (view) => {
        let completionResult = false;
        if (tabToAutocomplete && completionStatus(view.state) === "active") {
          // trigger preventDefault & stopPropagation based on completion
          completionResult = acceptCompletion(view);
        } else if (indentWithTab) {
          indentMore(view);
        }
        if (onTab) {
          onTab(completionResult);
        }
        // if tab controls indent, then we never want to propagate the keystroke, so return true
        // otherwise it depends on the completion result
        return indentWithTab || completionResult;
      },
    });
  }

  if (keyComboActions) {
    for (const [combo, action] of Object.entries(keyComboActions)) {
      keymapArray.push({
        key: combo,
        run: action,
      });
    }
  }

  return keymapArray;
}
