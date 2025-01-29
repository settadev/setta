import C from "constants/constants.json";
import _ from "lodash";
import { useSectionInfos } from "state/definitions";
import { dummyRegExpObject, escapeRegExp, templatePrefix } from "utils/utils";
import { getSectionPathFullName } from "./sectionInfos";

// input is state computed by keyword regex subscription
export function getTemplateVarsRegexAndColorMap(state) {
  const names = [C.SETTA_GENERATED_PYTHON, C.SETTA_GENERATED_PYTHON_IMPORTS];
  const fullRawNameToSectionId = {};
  for (const n of names) {
    fullRawNameToSectionId[n] = null;
  }

  const sectionState = useSectionInfos.getState();
  for (const sectionId of state.templateVarEligibleSections) {
    const fullName = getSectionPathFullName(sectionId, sectionState);
    names.push(escapeRegExp(fullName));
    fullRawNameToSectionId[fullName] = sectionId;
  }

  const fullNameToSectionId = _.mapKeys(fullRawNameToSectionId, (v, k) =>
    templatePrefix(k),
  );

  if (names.length === 0) {
    return {
      pattern: dummyRegExpObject(),
      fullNameToSectionId,
    };
  }

  const patternStr = `(?<![A-Za-z."'_])\\${C.TEMPLATE_PREFIX}(${names.join("|")})(?![A-Za-z"'_])`;
  const pattern = new RegExp(patternStr, "g");

  return { pattern, fullNameToSectionId };
}
