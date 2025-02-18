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
  // TODO: make this better instead of 3 for loops
  for (const [sectionId, suffixes] of Object.entries(
    state.templateVarEligibleSections,
  )) {
    const sectionFullName = getSectionPathFullName(sectionId, sectionState);
    for (const suffix of suffixes) {
      const fullName = sectionFullName + `${C.TEMPLATE_PREFIX}${suffix}`;
      names.push(escapeRegExp(fullName));
      fullRawNameToSectionId[fullName] = sectionId;
    }
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
