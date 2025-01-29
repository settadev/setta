import { Editable } from "components/Utils/Editable";
import { getFloatingBoxHandlers } from "components/Utils/FloatingBox";
import C from "constants/constants.json";
import { getSectionType, getSectionVariant } from "state/actions/sectionInfos";
import { createParamSweepSectionName } from "state/actions/uiTypes/utils";
import { maybeIncrementProjectStateVersion } from "state/actions/undo";
import { useNodeInternals, useSectionInfos } from "state/definitions";
import { useEditableOnSubmit } from "state/hooks/editableText";
import { getIsSeriesElementHelper } from "state/hooks/uiTypes";

export function SectionTitle({ sectionId, titleProps }) {
  const { sectionName, titleIsEditable } = useTitleIsEditable(sectionId);

  if (titleIsEditable) {
    return (
      <EditableTitle
        sectionId={sectionId}
        sectionName={sectionName}
        titleProps={titleProps}
        {...getFloatingBoxHandlers({ title: sectionName })}
      />
    );
  }
  return (
    <FixedTitle
      sectionName={sectionName}
      className={titleProps.fixed}
      {...getFloatingBoxHandlers({ title: sectionName })}
    />
  );
}

function FixedTitle({ sectionName, className, onMouseEnter, onMouseLeave }) {
  return (
    <h2
      className={className}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {sectionName}
    </h2>
  );
}

function EditableTitle({
  sectionId,
  sectionName,
  titleProps,
  onMouseEnter,
  onMouseLeave,
}) {
  function onTitleInputChange(value) {
    setSectionName(sectionId, value);
  }

  function condition(value) {
    return !getSiblingHasName(sectionId, value);
  }

  const [inputValue, onChange, onBlur, onKeyDown, blurTriggeredByEscapeKey] =
    useEditableOnSubmit(sectionName, onTitleInputChange, condition);

  return (
    <Editable
      value={inputValue}
      onChange={onChange}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      titleProps={titleProps}
      doubleClickToEdit={true}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      blurTriggeredByEscapeKey={blurTriggeredByEscapeKey}
    />
  );
}

function setSectionName(sectionId, name) {
  useSectionInfos.setState((x) => {
    const s = x.x[sectionId];
    s.name = name;
    if (s.paramSweepSectionId) {
      x.x[paramSweepSectionId].name = createParamSweepSectionName(name);
    }
    x.shouldRenameReferences = true;
  });
  maybeIncrementProjectStateVersion(true);
}

function useTitleIsEditable(sectionId) {
  return useSectionInfos((x) => {
    const isUneditableType = [
      C.GLOBAL_VARIABLES,
      C.PARAM_SWEEP,
      C.GLOBAL_PARAM_SWEEP,
    ].includes(getSectionType(sectionId, x));

    const isListElement = getIsSeriesElementHelper(sectionId, [C.LIST_ROOT], x);

    return {
      sectionName: x.x[sectionId].name,
      titleIsEditable: !isListElement && !isUneditableType,
    };
  });
}

function getSiblingHasName(sectionId, newName) {
  const state = useSectionInfos.getState();
  const { parentId } = state.x[sectionId];
  const siblingIds = parentId
    ? getSectionVariant(parentId).children
    : useNodeInternals.getState().x.keys();
  for (const s of siblingIds) {
    if (state.x[s].name === newName) {
      return true;
    }
  }
  return false;
}
