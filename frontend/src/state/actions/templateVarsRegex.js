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
  for (const sectionId of state.templateVarEligibleSections.importPath) {
    nameListHelper(
      names,
      fullRawNameToSectionId,
      sectionId,
      sectionState,
      `${C.TEMPLATE_PREFIX}${C.TEMPLATE_VAR_IMPORT_PATH_SUFFIX}`,
    );
  }

  for (const sectionId of state.templateVarEligibleSections.version) {
    nameListHelper(
      names,
      fullRawNameToSectionId,
      sectionId,
      sectionState,
      `${C.TEMPLATE_PREFIX}${C.TEMPLATE_VAR_VERSION_SUFFIX}`,
    );
  }

  for (const sectionId of state.templateVarEligibleSections.filePath) {
    nameListHelper(
      names,
      fullRawNameToSectionId,
      sectionId,
      sectionState,
      `${C.TEMPLATE_PREFIX}${C.TEMPLATE_VAR_FILE_PATH_SUFFIX}`,
    );
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

function nameListHelper(
  names,
  fullRawNameToSectionId,
  sectionId,
  sectionState,
  suffix,
) {
  const fullName = getSectionPathFullName(sectionId, sectionState) + suffix;
  names.push(escapeRegExp(fullName));
  fullRawNameToSectionId[fullName] = sectionId;
}
