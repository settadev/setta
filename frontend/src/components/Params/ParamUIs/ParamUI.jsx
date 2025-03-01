import { TextInputCodeMirror } from "components/Utils/CodeMirror/TextInputCodeMirror";
import C from "constants/constants.json";
import _ from "lodash";
import { getSectionVariant } from "state/actions/sectionInfos";
import { useMisc, useSectionInfos } from "state/definitions";
import { useTextFieldWaitingForLSPResult } from "state/hooks/lsp";
import { getParamUIType } from "state/hooks/uiTypes";
import {
  NO_PAN_CLASS_NAME,
  SETTA_PREVENT_ARROW_KEYS_MOVING_SECTION,
  SETTA_PREVENT_SECTION_ACTIVE_CSS,
} from "utils/constants";
import { focusOnSection } from "utils/tabbingLogic";
import { ColorPickerInput, ColorPickerInputConfig } from "./ColorPickerInput";
import { DropdownInput, DropdownInputConfig } from "./DropdownInput";
import { PasswordInput } from "./PasswordInput";
import { SliderInput, SliderInputConfig } from "./SliderInput";
import { SwitchInput, SwitchInputConfig } from "./SwitchInput";
import { TextInputConfig } from "./TextInput";

export function ParamUIConfig({ name, ...props }) {
  switch (name) {
    default:
      return <TextInputConfig {...props} />;
    case C.SLIDER:
      return <SliderInputConfig {...props} />;
    case C.SWITCH:
      return <SwitchInputConfig {...props} />;
    case C.COLOR_PICKER:
      return <ColorPickerInputConfig {...props} />;
    case C.DROPDOWN:
      return <DropdownInputConfig {...props} />;
  }
}

export function ParamUI({
  sectionId,
  paramInfoId,
  value,
  onChange,
  maybeErrorMessage,
  evRefs,
}) {
  const isSelectingParams = useMisc((x) => x.isSelectingParams);
  const { uiType, configLanguage, defaultVal, disabledOrFrozen } =
    useSectionInfos((x) => {
      const { isFrozen, configLanguage } = getSectionVariant(sectionId, x);
      return {
        uiType: getParamUIType(sectionId, paramInfoId, x),
        configLanguage: configLanguage,
        defaultVal: x.codeInfo[paramInfoId].defaultVal,
        disabledOrFrozen: x.codeInfo[paramInfoId].isDisabled || isFrozen,
      };
    }, _.isEqual);
  const waitingForResult = useTextFieldWaitingForLSPResult({
    sectionId,
    paramInfoId,
  });
  const isDisabled = isSelectingParams || disabledOrFrozen;

  function onEscape() {
    focusOnSection(null, sectionId, false);
  }

  // need to put the group/textinput in a higher div

  switch (uiType.type) {
    case C.TEXT:
      return (
        <>
          <TextInputCodeMirror
            dummyDivId={`${sectionId}-${paramInfoId}-ParamInput`}
            dataSectionId={sectionId}
            visualSectionId={sectionId}
            paramInfoId={paramInfoId}
            value={value}
            defaultVal={defaultVal}
            onChange={onChange}
            onEscape={(completionResult) => {
              if (!completionResult) {
                onEscape();
              }
            }}
            dummyCodeClassName={`${NO_PAN_CLASS_NAME} section-value self-end peer/textinput ${maybeErrorMessage ? "[&_*]:!text-red-500" : ""} nodrag ${!isDisabled ? "cursor-text select-text" : ""} break-words font-mono text-xs [tab-size:4] [word-break:break-word] py-[.125rem]`}
            realCodeClassName={`${NO_PAN_CLASS_NAME} nodrag self-end peer/textinput ${maybeErrorMessage ? "[&_*]:!text-red-500" : ""} [&_*]:!outline-0 cursor-text select-text [&_.cm-activeLine]:!px-0 [&_.cm-activeLine]:!bg-setta-200/10 [&_.cm-content]:!py-0 [&_.cm-content]:!px-0 [&_.cm-line]:!px-0 [&_.cm-content]:text-xs section-value py-[.125rem]`}
            language={configLanguage}
            evRefs={evRefs}
            isDisabled={isDisabled}
          />
          {waitingForResult && (
            <i className="section-value gg-spinner self-center justify-self-end text-blue-500/70" />
          )}
          <span
            className={`section-value grid-row-start-1 border-box self-end border-b border-setta-200/50 dark:border-setta-600/30 ${!isSelectingParams ? "peer-focus-within/textinput:border-blue-400" : ""}`}
          />
        </>
      );
    case C.SLIDER: {
      const { min, max, step } = uiType.config;
      return (
        <SliderInput
          value={value}
          defaultVal={defaultVal}
          onChange={onChange}
          onEscape={onEscape}
          min={min}
          max={max}
          step={step}
          isDisabled={isDisabled}
          wrapperDivClass={`${SETTA_PREVENT_SECTION_ACTIVE_CSS} cursor-pointer @container/slider section-value flex gap-1`}
          sliderRootClassName=" data[orientation='vertical']:flex-col data[orientation='vertical']:w-5 data[orientation='vertical']:h-24 SliderRoot relative flex w-full touch-none select-none items-center data-[orientation='horizontal']:h-5"
          sliderTrackClassName="relative flex-grow rounded-full bg-setta-200 data-[orientation='horizontal']:h-[3px] data-[orientation='vertical']:w-[3px] dark:bg-setta-700"
          sliderRangeClassName="absolute h-full rounded-full bg-blue-500"
          sliderThumbClassName={`${SETTA_PREVENT_ARROW_KEYS_MOVING_SECTION} block h-3 w-3 cursor-pointer
      rounded-full border-2 border-setta-300 bg-white shadow-sm drop-shadow-md hover:!bg-setta-100 hover:dark:!bg-setta-700 focus-visible:!border-blue-500 focus-visible:bg-blue-500 focus-visible:dark:bg-blue-700 focus-visible:outline-none dark:border-setta-400 dark:bg-setta-600 data-[disabled]:pointer-events-none`}
          textInputClassName="hidden my-auto mr-[1px] h-5/6 w-8 cursor-auto resize-none rounded-lg border border-solid border-setta-300/20 bg-white px-2 text-center font-mono text-xs focus-visible:border-blue-300 dark:border-setta-875 dark:bg-setta-875 dark:text-setta-300 @[132px]/slider:block"
        />
      );
    }
    case C.SWITCH:
      return (
        <SwitchInput
          value={value}
          defaultVal={defaultVal}
          onChange={onChange}
          onEscape={onEscape}
          isDisabled={isDisabled}
          outerDivClassName="section-value flex justify-self-start self-center"
          twRootClasses="nodrag"
        />
      );
    case C.COLOR_PICKER:
      const { colorChoices } = uiType.config;
      return (
        <ColorPickerInput
          colorChoices={colorChoices}
          value={value}
          onChange={onChange}
          onEscape={onEscape}
          wrapperClassName="section-value single-cell-container min-w-0 w-[calc(100%_-_2px)] justify-self-start self-center h-[calc(100%_-_4px)] min-h-0"
          colorPickerChoicesClasses="flex-1 cursor-pointer items-center overflow-hidden rounded-lg single-cell-container colorpicker h-full min-h-0 w-full min-w-0 items-center text-white"
          isDisabled={isDisabled}
        />
      );
    case C.DROPDOWN:
      const { choices } = uiType.config;
      return (
        <DropdownInput
          choices={choices}
          value={value}
          onChange={onChange}
          outerDivClasses="section-value flex justify-self-start self-center [&_search]:my-auto"
          isDisabled={isDisabled}
        />
      );
    case C.PASSWORD:
      return (
        <>
          <PasswordInput
            className={`${!isDisabled ? "cursor-text select-text" : ""} nodrag section-value peer/textinput flex min-w-0 max-w-[calc(100%_-_1.1rem)] self-center justify-self-start font-mono text-xs text-[rgb(3,_47,_98);] dark:text-[rgb(165,_214,_255)]`}
            value={value}
            onChange={onChange}
            onEscape={onEscape}
            isDisabled={isDisabled}
          />
          <span
            className={`section-value grid-row-start-1 border-box self-end border-b border-setta-200/50 dark:border-setta-600/30 ${!isSelectingParams ? "peer-focus-within/textinput:border-blue-400" : ""}`}
          />
        </>
      );
  }
}

export function ParamSweepUI({
  dataSectionId,
  visualSectionId,
  paramInfoId,
  value,
  defaultVal,
  onChange,
  evRefs,
  isDisabled,
}) {
  const { uiType, configLanguage } = useSectionInfos((x) => {
    return {
      uiType: getParamUIType(dataSectionId, paramInfoId, x),
      configLanguage: getSectionVariant(dataSectionId, x).configLanguage,
    };
  }, _.isEqual);
  const waitingForResult = useTextFieldWaitingForLSPResult({
    dataSectionId,
    paramInfoId,
  });
  const isSelectingParams = useMisc((x) => x.isSelectingParams);

  switch (uiType.type) {
    default:
      return (
        <>
          <TextInputCodeMirror
            dataSectionId={dataSectionId}
            visualSectionId={visualSectionId}
            paramInfoId={paramInfoId}
            value={value}
            defaultVal={defaultVal}
            onChange={onChange}
            dummyCodeClassName="section-key-value peer/textinput self-end grid-row-start-1 mx-3 py-[.125rem] nodrag cursor-text select-text break-words px-0 font-mono text-xs [tab-size:4] [word-break:break-word]"
            realCodeClassName="section-key-value peer/textinput self-end grid-row-start-1 py-[.125rem] mx-3 nodrag [&_*]:!outline-0 cursor-text select-text [&_.cm-activeLine]:!px-0 [&_.cm-activeLine]:!bg-setta-200/10 [&_.cm-content]:!py-0 [&_.cm-content]:!px-0 [&_.cm-line]:!px-0 [&_.cm-content]:text-xs first:[&_.cm-line>*]:mt-[3px]"
            language={configLanguage}
            evRefs={evRefs}
            isDisabled={isDisabled}
          />
          {waitingForResult && (
            <i className="section-value gg-spinner self-center justify-self-end text-blue-500/70" />
          )}
          <span
            className={`section-key-value grid-row-start-1 border-box mx-3 self-end border-b border-setta-200/50 ${!isSelectingParams ? "peer-focus-within/textinput:border-blue-400" : ""} dark:border-setta-600/30`}
          />
        </>
      );
    case C.SLIDER: {
      const { min, max, step } = uiType.config;
      return (
        <SliderInput
          value={value}
          defaultVal={defaultVal}
          onChange={onChange}
          min={min}
          max={max}
          step={step}
          isDisabled={isDisabled}
          wrapperDivClass="section-key-value flex gap-1 ml-2"
          sliderRootClassName="data[orientation='vertical']:flex-col data[orientation='vertical']:w-5 data[orientation='vertical']:h-24 SliderRoot relative flex w-full touch-none select-none items-center data-[orientation='horizontal']:h-5"
          sliderTrackClassName="relative flex-grow rounded-full bg-setta-200 data-[orientation='horizontal']:h-[3px] data-[orientation='vertical']:w-[3px] dark:bg-setta-700"
          sliderRangeClassName="absolute h-full rounded-full bg-blue-500"
          sliderThumbClassName={`${SETTA_PREVENT_ARROW_KEYS_MOVING_SECTION} block h-3 w-3 cursor-pointer
      rounded-full border-2 border-setta-300 bg-white shadow-sm drop-shadow-md hover:bg-setta-100 focus:border-blue-500 focus-visible:outline-none dark:border-setta-400 dark:bg-setta-600`}
          textInputClassName="w-8 cursor-auto resize-none rounded-lg border border-solid border-setta-300/20 bg-white px-2 text-center font-mono text-xs focus-visible:border-blue-300 dark:border-setta-875 dark:bg-setta-875 dark:text-setta-300"
        />
      );
    }
    case C.SWITCH:
      return (
        <SwitchInput
          value={value}
          defaultVal={defaultVal}
          onChange={onChange}
          isDisabled={isDisabled}
          outerDivClassName="section-key-value flex justify-self-start self-center ml-2"
          twRootClasses="nodrag"
        />
      );
    case C.COLOR_PICKER:
      const { colorChoices } = uiType.config;
      return (
        <ColorPickerInput
          colorChoices={colorChoices}
          value={value}
          onChange={onChange}
          wrapperClassName="section-key-value single-cell-container w-[calc(100%_-_1.25rem)] min-h-0 flex justify-self-start self-center ml-2"
          colorPickerChoicesClasses="flex-1 cursor-pointer items-center overflow-hidden rounded-lg single-cell-container colorpicker h-full min-h-0 w-full min-w-0 items-center text-white"
          isDisabled={isDisabled}
        />
      );
    case C.DROPDOWN:
      const { choices } = uiType.config;
      return (
        <DropdownInput
          choices={choices}
          value={value}
          onChange={onChange}
          outerDivClasses="section-key-value w-[calc(100%_-_1.15rem)] ml-2 flex justify-self-start self-center [&_search]:my-auto"
          isDisabled={isDisabled}
        />
      );
    case C.PASSWORD:
      return (
        <PasswordInput
          className={`${!isDisabled ? "cursor-text select-text" : ""} nodrag section-value flex self-center justify-self-start`}
          value={value}
          onChange={onChange}
          isDisabled={isDisabled}
        />
      );
  }
}
