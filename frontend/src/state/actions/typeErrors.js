import _ from "lodash";
import { useSectionInfos, useTypeErrors } from "state/definitions";
import { setNotificationMessage } from "./notification";

export function processTypeErrors(content) {
  const { projectConfigId, codeSectionId, diagnostics } = content;
  if (projectConfigId !== useSectionInfos.getState().projectConfig.id) {
    return;
  }

  const typeErrors = {};

  for (const d of diagnostics) {
    const { sectionId, paramInfoId, message } = d;
    if (useSectionInfos.getState().codeInfo[paramInfoId].ignoreTypeErrors) {
      continue;
    }
    if (!(sectionId in typeErrors)) {
      typeErrors[sectionId] = {};
    }
    if (!(paramInfoId in typeErrors[sectionId])) {
      typeErrors[sectionId][paramInfoId] = [];
    }
    typeErrors[sectionId][paramInfoId].push(message);
  }

  if (useTypeErrors.getState().userRequested) {
    setNotificationMessage(
      _.size(typeErrors) === 0
        ? "No type errors"
        : `Found ${_.size(typeErrors)} type errors`,
    );
  }
  useTypeErrors.getState().reset();
  useTypeErrors.setState({ errors: typeErrors });
}

export function removeTypeErrorsForParam(paramInfoId, state) {
  for (const section of Object.values(state.errors)) {
    if (paramInfoId in section) {
      delete section[paramInfoId];
    }
  }
}
