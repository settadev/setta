import CodeMirror from "@uiw/react-codemirror";
import { useCodeMirrorStyle } from "components/Utils/CodeMirror/useCodeMirrorStyle";
import { useCallback, useMemo, useState } from "react";
import {
  dbTextFieldCompletion,
  dbTextFieldInitializeCode,
} from "requests/sections";
import { setActiveSectionIdAndUpdateZIndex } from "state/actions/activeSections";
import { DummyCodeMirror } from "./DummyCodeMirror";
import { getExtensions } from "./getExtensions";
import { getKeywordStylizer } from "./getKeywordStylizer";
import { getCompletionsFn, getOnCreateEditor } from "./getOnCreateEditor";

export function TextInputCodeMirror({
  dataSectionId,
  visualSectionId,
  paramInfoId,
  value,
  defaultVal,
  onChange,
  onBlur,
  onMouseDown,
  dummyCodeClassName,
  realCodeClassName,
  singleLine,
  keyComboActions,
  onEscape,
  onTab,
  color,
  language,
  evRefs,
  dummyDivId,
  autocomplete = true,
  initializeGenCode = true,
  isKeyName = false,
  isDisabled = false,
}) {
  const [activationEvent, setActivationEvent] = useState(null);
  const [realIsInitialized, setRealIsInitialized] = useState(false);
  const theme = useCodeMirrorStyle(color);

  function localOnBlur() {
    // hack to prevent codemirror from
    // blocking other inputs on blur
    // https://github.com/uiwjs/react-codemirror/issues/677
    setTimeout(() => {
      setActivationEvent(null);
      setRealIsInitialized(false);
    }, 0);
    onBlur?.();
  }

  // Has to be onMouseDownCapture to avoid section outline flashing
  // when section is locked.
  function localOnMouseDownCapture(event) {
    if (isDisabled) {
      onMouseDown?.(event);
      return;
    }
    if (event.button === 0) {
      setActivationEvent(event);
      setActiveSectionIdAndUpdateZIndex(visualSectionId);
    }
    onMouseDown?.(event);
  }

  // focused via tab key
  function onFocus() {
    if (isDisabled) {
      return;
    }
    if (language === "python" && initializeGenCode) {
      dbTextFieldInitializeCode({ sectionId: dataSectionId, paramInfoId });
    }
    if (!activationEvent) {
      setActivationEvent("tab");
    }
  }

  return (
    <>
      {!realIsInitialized && (
        <DummyCodeMirror
          divId={dummyDivId}
          code={value}
          onMouseDownCapture={localOnMouseDownCapture}
          onFocus={onFocus}
          className={dummyCodeClassName}
          theme={theme}
          evRefs={evRefs}
          placeholder={defaultVal}
          language={language}
        />
      )}
      {activationEvent && (
        <CoreCodeMirror
          dataSectionId={dataSectionId}
          visualSectionId={visualSectionId}
          paramInfoId={paramInfoId}
          value={value}
          defaultVal={defaultVal}
          onChange={onChange}
          className={realCodeClassName}
          singleLine={singleLine}
          keyComboActions={keyComboActions}
          onEscape={onEscape}
          onTab={onTab}
          onBlur={localOnBlur}
          initialEvent={activationEvent}
          realIsInitialized={realIsInitialized}
          setRealIsInitialized={setRealIsInitialized}
          theme={theme}
          evRefs={evRefs}
          language={language}
          autocomplete={autocomplete}
          isKeyName={isKeyName}
        />
      )}
    </>
  );
}

function CoreCodeMirror({
  dataSectionId,
  visualSectionId,
  paramInfoId,
  value,
  defaultVal,
  onChange,
  className,
  singleLine,
  keyComboActions,
  onEscape,
  onBlur,
  onTab,
  initialEvent,
  realIsInitialized,
  setRealIsInitialized,
  theme,
  evRefs,
  language,
  autocomplete,
  isKeyName,
}) {
  const divId = `CodeMirror-${visualSectionId}-${paramInfoId}${isKeyName ? "-keyName" : ""}`;

  const keywordStylizer = useMemo(
    () => getKeywordStylizer(evRefs),
    [JSON.stringify(evRefs)],
  );

  const completionsFn = useCallback(
    autocomplete
      ? getCompletionsFn(
          dataSectionId,
          paramInfoId,
          dbTextFieldCompletion,
          language,
        )
      : () => null,
    [dataSectionId, paramInfoId, autocomplete, language],
  );

  const extensions = getExtensions({
    sectionId: visualSectionId,
    language,
    completionsFn,
    keywordStylizer,
    singleLine,
    tabToAutocomplete: true,
    keyComboActions,
    onTab,
    onEscape,
  });

  const onCreateEditor = getOnCreateEditor({
    evRefs,
    initialEvent,
    setRealIsInitialized,
    divId,
    value,
    defaultVal,
  });

  return (
    <CodeMirror
      id={divId}
      className={`${className} ${!realIsInitialized ? "opacity-0" : ""}`}
      value={value}
      placeholder={defaultVal}
      basicSetup={{
        lineNumbers: false,
        foldGutter: false,
        highlightActiveLine: false,
        tabSize: 4,
      }}
      onCreateEditor={onCreateEditor}
      theme={theme}
      extensions={extensions}
      onChange={onChange}
      onBlur={onBlur}
      indentWithTab={false} // I take care of this in getExtensions
      tabIndex="0" // need this for tabbingLogic to work
    />
  );
}
