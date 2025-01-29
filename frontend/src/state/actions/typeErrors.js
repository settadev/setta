import _ from "lodash";
import { useProjectConfig, useTypeErrors } from "state/definitions";
import { setNotificationMessage } from "./notification";

export function processTypeErrors(content) {
  const { projectConfigId, codeSectionId, diagnostics } = content;
  if (projectConfigId !== useProjectConfig.getState().id) {
    return;
  }

  const typeErrors = {};

  for (const d of diagnostics) {
    const { sectionId, paramInfoId, message } = d;
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
