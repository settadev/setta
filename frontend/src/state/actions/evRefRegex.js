import C from "constants/constants.json";
import { dummyRegExpObject, escapeRegExp } from "utils/utils";

// input is state computed by keyword regex subscription
export function getEVRefRegexAndColorMap(state) {
  const names = [];
  const fullNameToInfo = {};
  for (const sid of Object.keys(state.details)) {
    if (!state.details[sid].isTopLevelAndCanHaveEVRefs) {
      continue;
    }
    if (state.globalVariableId === sid) {
      setFullParamRegex(state, sid, null, names, fullNameToInfo, "", [], true);
    } else {
      const currName = state.details[sid].name;
      setFullChildrenNamesForRegex(
        state,
        names,
        fullNameToInfo,
        sid,
        currName,
        [currName.length],
      );
    }
  }

  if (names.length === 0) {
    return {
      pattern: dummyRegExpObject(),
      codeAreaPattern: dummyRegExpObject(),
      fullNameToInfo,
    };
  }

  const patternStr = `(?<![A-Za-z."'_])(${names.join("|")})(?![A-Za-z"'_])`;
  const pattern = new RegExp(patternStr, "g");
  const codeAreaPattern = new RegExp(
    `(?<=.*?\\${C.TEMPLATE_PREFIX}${C.SETTA_GENERATED_PYTHON}.*?)${patternStr}`,
    "gs",
  );

  return { pattern, codeAreaPattern, fullNameToInfo };
}

function setFullChildrenNamesForRegex(
  state,
  allNames,
  fullNameToInfo,
  sectionId,
  parentName,
  parentLengths,
) {
  const sectionTypeName = state.details[sectionId].sectionTypeName;
  for (const [idx, c] of state.details[sectionId].sectionChildren.entries()) {
    const name = state.details[c].name;
    const currComponentName =
      sectionTypeName === C.LIST_ROOT ? `[${idx.toString()}]` : `["${name}"]`;
    const currFullName = `${parentName}${currComponentName}`;
    setFullChildrenNamesForRegex(
      state,
      allNames,
      fullNameToInfo,
      c,
      currFullName,
      [...parentLengths, currFullName.length],
    );
  }
  const fullName = parentName;
  const argsFullName = `${C.ARGS_PREFIX}${parentName}`;
  const argsParentLengths = parentLengths.map((x) => x + C.ARGS_PREFIX.length);
  setFullParamRegex(
    state,
    sectionId,
    state.details[sectionId].selectedItem,
    allNames,
    fullNameToInfo,
    argsFullName,
    argsParentLengths,
  );
  allNames.push(escapeRegExp(fullName));
  fullNameToInfo[fullName] = {
    sectionId,
    paramInfoId: null,
    componentIndices: parentLengths,
    isArgsObj: false,
  };
  if (sectionTypeName === C.SECTION) {
    allNames.push(escapeRegExp(argsFullName));
    fullNameToInfo[argsFullName] = {
      sectionId,
      paramInfoId: null,
      componentIndices: argsParentLengths,
      isArgsObj: true,
    };
  }
}

function setFullParamRegex(
  state,
  sectionId,
  codeInfoId,
  allNames,
  fullNameToInfo,
  parentName,
  parentLengths,
  isGlobalVar = false,
) {
  const codeInfoChildren = state.details[sectionId].codeInfoChildren;
  const childParamInfos = codeInfoChildren[codeInfoId].map(
    (x) => state.codeInfo[x],
  );

  for (const p of childParamInfos) {
    if (!p.name || p.rcType !== C.PARAMETER) {
      continue;
    }
    const fullName = isGlobalVar ? p.name : `${parentName}["${p.name}"]`;
    const newLengthsArray = [...parentLengths, fullName.length];
    setFullParamRegex(
      state,
      sectionId,
      p.id,
      allNames,
      fullNameToInfo,
      fullName,
      newLengthsArray,
    );
    allNames.push(escapeRegExp(fullName));
    fullNameToInfo[fullName] = {
      sectionId,
      paramInfoId: p.id,
      componentIndices: newLengthsArray,
      isArgsObj: false,
    };
  }
}
