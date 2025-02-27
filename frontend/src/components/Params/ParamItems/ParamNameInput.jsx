import { TextInputCodeMirror } from "components/Utils/CodeMirror/TextInputCodeMirror";
import _ from "lodash";
import { changeCodeInfoName } from "state/actions/codeInfo";
import { getSectionVariant } from "state/actions/sectionInfos";
import { useMisc, useSectionInfos } from "state/definitions";
import { NO_PAN_CLASS_NAME } from "utils/constants";
import { focusOnSection } from "utils/tabbingLogic";

export function ParamNameInput({
  border,
  bg,
  sectionId,
  paramInfoId,
  hasChildren,
  onMouseDown,
}) {
  const {
    configLanguage,
    name: value,
    variantIsFrozen,
  } = useSectionInfos((x) => {
    return {
      variantIsFrozen: getSectionVariant(sectionId, x).isFrozen,
      configLanguage: x.x[sectionId].configLanguage,
      name: x.codeInfo[paramInfoId].name,
    };
  }, _.isEqual);

  function onChange(v) {
    useSectionInfos.setState((state) => {
      changeCodeInfoName(sectionId, paramInfoId, v, state);
    });
  }

  function onEscape(completionResult) {
    if (!completionResult) {
      focusOnSection(null, sectionId, false);
    }
  }

  const isSelectingParams = useMisc((x) => x.isSelectingParams);
  const isDisabled = isSelectingParams || variantIsFrozen;

  return (
    <>
      <TextInputCodeMirror
        dataSectionId={sectionId}
        visualSectionId={sectionId}
        paramInfoId={paramInfoId}
        value={value}
        defaultVal={"Please Enter Key"}
        onChange={onChange}
        onEscape={onEscape}
        dummyCodeClassName={`${NO_PAN_CLASS_NAME} ${bg} ${border} min-w-0 self-end truncate placeholder:text-setta-300 dark:placeholder:text-setta-600 ${hasChildren ? "section-key-value grid-row-start-1 px-[2px]" : "section-key"} nodrag peer/nameinput ${!isDisabled ? "cursor-text select-text" : ""} break-words py-[.125rem] font-mono text-xs [tab-size:4] [word-break:break-word] dark:focus-visible:border-blue-400`}
        realCodeClassName={`${NO_PAN_CLASS_NAME} nodrag cursor-text self-end select-text [&_*]:!outline-0 [&_.cm-activeLine]:!px-0 [&_.cm-activeLine]:!bg-setta-200/10 [&_.cm-content]:!py-0 [&_.cm-content]:!px-0 [&_.cm-line]:!px-0 [&_.cm-content]:text-xs min-w-0 truncate placeholder:text-setta-300 dark:placeholder:text-setta-600 py-[.125rem] ${hasChildren ? "section-key-value grid-row-start-1 px-[2px]" : "section-key"} peer/nameinput font-mono dark:focus-visible:border-blue-400`}
        color="green"
        language={configLanguage}
        evRefs={[]}
        initializeGenCode={false}
        autocomplete={false}
        isKeyName={true}
        isDisabled={isDisabled}
        onMouseDown={onMouseDown}
      />
      <span
        className={`${hasChildren ? "section-key-value grid-row-start-1 mx-[2px]" : "section-key"} border-box self-end border-b border-setta-200/50 peer-focus-within/nameinput:border-blue-400 dark:border-setta-600/30`}
      />
    </>
  );
}
