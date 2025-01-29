import { TextInputCodeMirror } from "components/Utils/CodeMirror/TextInputCodeMirror";
import { getFloatingBoxHandlers } from "components/Utils/FloatingBox";
import _ from "lodash";
import { useCallback, useEffect, useRef, useState } from "react";
import { debouncedTypeCheckRequest, getEVRefs } from "requests/sections";
import { getSectionVariant } from "state/actions/sectionInfos";
import { setSelectedItem } from "state/actions/sections/setSelectedItem";
import { useSectionInfos } from "state/definitions";
import { useTextFieldWaitingForLSPResult } from "state/hooks/lsp";
import { useSectionVariantIsFrozen } from "state/hooks/sectionVariants";
import useDeepCompareEffect from "use-deep-compare-effect";
import { focusOnSection } from "utils/tabbingLogic";
import { asyncDebounce } from "utils/utils";

export function SectionSearch({ sectionId, selectedItem }) {
  const variantIsFrozen = useSectionVariantIsFrozen(sectionId);

  function callbackSetAttr(id, state) {
    // for this callback, an undefined id means that the selectedItem is already selected.
    if (id !== undefined) {
      getSectionVariant(sectionId, state).selectedItem = id;
    }
  }

  function onEnter(value) {
    // gets called inside useSectionInfos.setState
    setSelectedItem(sectionId, sectionId, value, callbackSetAttr);
    debouncedTypeCheckRequest();
  }

  function onShiftEnter(value) {
    setSelectedItem(sectionId, sectionId, value, callbackSetAttr, true);
    debouncedTypeCheckRequest();
  }

  return (
    <SectionSearchCore
      divId={`${sectionId}-search`}
      dataSectionId={sectionId}
      visualSectionId={sectionId}
      selectedItem={selectedItem}
      onEnter={onEnter}
      onShiftEnter={onShiftEnter}
      dummyCodeClassName="single-cell-child rounded-2xl border border-solid border-setta-100 bg-white py-1 dark:border-setta-800 dark:bg-setta-950 nodrag cursor-text select-text break-words px-[.625rem] font-mono mx-[.125rem] text-xs [tab-size:4] [word-break:break-word]"
      realCodeClassName="single-cell-child nodrag [&_*]:!outline-0 cursor-text select-text [&_.cm-activeLine]:rounded-md [&_.cm-content]:!py-0 [&_.cm-content]:text-xs first:[&_.cm-line>*]:mt-[3px] rounded-2xl border border-solid border-blue-500 bg-white mx-[.125rem] py-1  dark:border-blue-400/50 dark:bg-setta-950 [&_.cm-line]:px-[.625rem] [&_.cm-activeLine]:!bg-inherit"
      isDisabled={variantIsFrozen}
    />
  );
}

export function ParamSweepSectionSearch({
  sectionId,
  forSectionId,
  selectedItem,
  variantId,
  selectedItemIdx,
  onPlusClick,
  onMinusClick,
  disablePlusButton,
  isDisabled,
}) {
  async function onEnter(value) {
    // gets called inside useSectionInfos.setState
    function callbackSetAttr(id, state) {
      let selectedItem = id;
      // for this callback, an undefined id means that the selectedItem is already selected in the forSectionId section
      if (id === undefined) {
        selectedItem =
          state.variants[state.x[forSectionId].variantId].selectedItem;
      }
      state.variants[variantId].sweep[selectedItemIdx].selectedItem =
        selectedItem;
    }

    setSelectedItem(forSectionId, sectionId, value, callbackSetAttr);
  }

  function onShiftEnter(value) {}

  return (
    <div className="section-search flex items-center justify-between gap-0.5">
      <SectionSearchCore
        dataSectionId={forSectionId}
        visualSectionId={sectionId}
        selectedItem={selectedItem}
        onEnter={onEnter}
        onShiftEnter={onShiftEnter}
        isDisabled={isDisabled}
        dummyCodeClassName="single-cell-child rounded-2xl border border-solid border-setta-100 bg-white py-1 dark:border-setta-800 dark:bg-setta-950 nodrag cursor-text select-text break-words px-[.625rem] font-mono mx-[.125rem] text-xs [tab-size:4] [word-break:break-word]"
        realCodeClassName="single-cell-child nodrag [&_*]:!outline-0 cursor-text select-text [&_.cm-activeLine]:rounded-md [&_.cm-content]:!py-0 [&_.cm-content]:text-xs first:[&_.cm-line>*]:mt-[3px] rounded-2xl border border-solid border-blue-500 bg-white mx-[.125rem] py-1  dark:border-blue-400/50 dark:bg-setta-950 [&_.cm-line]:px-[.625rem] [&_.cm-activeLine]:!bg-inherit"
      />
      <div className="flex">
        <button
          className="flex h-[22px] cursor-pointer rounded-full text-setta-300 
            hover:text-setta-600 dark:text-setta-700 dark:hover:text-setta-400 [&>i]:focus-visible:!border-blue-500"
          onClick={onMinusClick}
          disabled={isDisabled}
        >
          <i className="gg-remove" />
        </button>
        <button
          className="flex h-[22px] cursor-pointer rounded-full text-setta-300 
            hover:text-setta-600 dark:text-setta-700 dark:hover:text-setta-400 [&>i]:focus-visible:!border-blue-500"
          onClick={onPlusClick}
          disabled={disablePlusButton || isDisabled}
        >
          <i className="gg-add" />
        </button>
      </div>
    </div>
  );
}

function SectionSearchCore({
  dataSectionId,
  visualSectionId,
  selectedItem,
  onEnter,
  onShiftEnter,
  dummyCodeClassName,
  realCodeClassName,
  isDisabled,
  divId,
}) {
  const {
    name: codeInfoName,
    evRefs,
    description,
    configLanguage,
  } = useSectionInfos((x) => {
    const configLanguage = x.x[dataSectionId].configLanguage;
    if (selectedItem) {
      const { name, evRefs, description } = x.codeInfo[selectedItem];
      return { name, evRefs, description, configLanguage };
    }
    return { name: "", evRefs: [], description: "", configLanguage };
  }, _.isEqual);

  const [value, setValue] = useState(codeInfoName);
  const [localEVRefs, setLocalEVRefs] = useState(evRefs);
  const [valueNameInconsistent, setValueNameInconsistent] = useState(false);
  const shouldResetValueOnBlur = useRef(false);

  const debouncedSetValueNameInconsistent = useCallback(
    _.debounce((x) => {
      setValueNameInconsistent(x);
    }, 1000),
    [setValueNameInconsistent],
  );

  function setValueAndCheckConsistency(value, cancelDebounced = false) {
    setValue(value);
    if (cancelDebounced) {
      debouncedSetValueNameInconsistent.cancel();
      setValueNameInconsistent(false);
    } else {
      debouncedSetValueNameInconsistent(value !== codeInfoName);
    }
  }

  useEffect(() => {
    setValueAndCheckConsistency(codeInfoName, true);
  }, [codeInfoName]);

  useDeepCompareEffect(() => {
    setLocalEVRefs(evRefs);
  }, [evRefs]);

  function onBlur() {
    if (shouldResetValueOnBlur.current) {
      setValueAndCheckConsistency(codeInfoName, true);
    }
    shouldResetValueOnBlur.current = false;
  }

  function onEscape(completionResult) {
    if (!completionResult) {
      shouldResetValueOnBlur.current = true;
      focusOnSection(null, visualSectionId, false);
    }
  }

  function onTab(completionResult) {
    if (!completionResult && value) {
      shouldResetValueOnBlur.current = false;
      onEnter(value);
    }
  }

  function onChange(value) {
    setValueAndCheckConsistency(value);
    debouncedSetLocalEVRefs(dataSectionId, value, setLocalEVRefs);
  }

  function _onEnter() {
    onEnter(value);
  }

  function _onShiftEnter() {
    onShiftEnter(value);
  }

  const keyComboActions = {
    Enter: _onEnter,
    "Alt-Enter": _onShiftEnter,
  };

  // TODO: Shouldn't use important for this, but ok for now. FIX.
  const valueNameInconsistentStyle = valueNameInconsistent
    ? "!border-amber-500 dark:!border-amber-800"
    : "";

  return (
    <search
      className="section-search single-cell-container w-full"
      {...getFloatingBoxHandlers({ title: codeInfoName, content: description })}
    >
      <TextInputCodeMirror
        dummyDivId={divId}
        dataSectionId={dataSectionId}
        visualSectionId={visualSectionId}
        paramInfoId={null}
        value={value}
        onBlur={onBlur}
        onChange={onChange}
        dummyCodeClassName={`${dummyCodeClassName} ${valueNameInconsistentStyle}`}
        realCodeClassName={`${realCodeClassName} ${valueNameInconsistentStyle}`}
        singleLine={true}
        keyComboActions={keyComboActions}
        onTab={onTab}
        onEscape={onEscape}
        language={configLanguage}
        evRefs={localEVRefs}
        isDisabled={isDisabled}
      />
      <LoadingSpinner sectionId={dataSectionId} />
    </search>
  );
}

function LoadingSpinner({ sectionId }) {
  const waitingForResult = useTextFieldWaitingForLSPResult({
    sectionId,
    paramInfoId: null,
  });
  // const waitingForResult = true;
  return (
    waitingForResult && (
      <i className="single-cell-child gg-spinner mr-2 self-center justify-self-end text-blue-500/70" />
    )
  );
}

const debouncedSetLocalEVRefs = asyncDebounce(
  async (sectionId, value, setLocalEVRefs) => {
    const evRefs = await getEVRefs({
      sectionId,
      paramInfoId: null,
      fullText: value,
    });
    setLocalEVRefs(evRefs);
  },
  50,
);
