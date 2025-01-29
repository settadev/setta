import { useEVRefRegex, useTemplateVarRegex } from "state/definitions";

export function roundUpIdx(numList, x) {
  let closest = undefined;

  // Loop through each number in the list
  for (let num of numList) {
    if (num >= x) {
      // Check if the number is larger than x
      // If closest is not set or current number is closer to x than the current closest
      if (closest === undefined || num - x < closest - x) {
        closest = num;
      }
    }
  }

  return closest;
}

export function constructEVRefs(keywordPositions, fullText) {
  const output = [];
  const { fullNameToInfo } = useEVRefRegex.getState();
  for (const k of keywordPositions) {
    const keyword = fullText.substring(k.startPos, k.endPos);
    if (keyword in fullNameToInfo) {
      const info = fullNameToInfo[keyword];
      output.push({
        sectionId: info.sectionId,
        paramInfoId: info.paramInfoId,
        isArgsObj: info.isArgsObj,
        startPos: k.startPos,
        keyword,
      });
    }
  }

  return output;
}

export function constructTemplateVars(keywordPositions, fullText) {
  const output = [];
  const { fullNameToSectionId } = useTemplateVarRegex.getState();
  for (const k of keywordPositions) {
    const keyword = fullText.substring(k.startPos, k.endPos);
    if (keyword in fullNameToSectionId) {
      output.push({
        sectionId: fullNameToSectionId[keyword],
        startPos: k.startPos,
        keyword,
      });
    }
  }
  return output;
}

export function computeInfoToFullName() {
  const output = {};
  for (const [k, v] of Object.entries(
    useEVRefRegex.getState().fullNameToInfo,
  )) {
    output[
      keyForInfoToFullName({
        sectionId: v.sectionId,
        paramInfoId: v.paramInfoId,
        isArgsObj: v.isArgsObj,
      })
    ] = k;
  }
  return output;
}

export function keyForInfoToFullName({
  sectionId,
  paramInfoId = null,
  isArgsObj = false,
}) {
  return JSON.stringify([sectionId, paramInfoId, isArgsObj]);
}

function evRefDoesNotReferToSelf({
  fullNameToInfo,
  keyword,
  sectionId,
  paramInfoId,
}) {
  return !(
    (fullNameToInfo[keyword].sectionId === sectionId &&
      !fullNameToInfo[keyword].paramInfoId) ||
    (fullNameToInfo[keyword].sectionId === sectionId &&
      fullNameToInfo[keyword].paramInfoId === paramInfoId)
  );
}

export function findCandidateEVRefs({
  sectionId,
  paramInfoId,
  value,
  regexPatternKey,
}) {
  let match;
  const output = new Set();
  const { [regexPatternKey]: evRefRegex, fullNameToInfo } =
    useEVRefRegex.getState();
  while ((match = evRefRegex.exec(value))) {
    if (
      evRefDoesNotReferToSelf({
        fullNameToInfo,
        keyword: match[0],
        sectionId,
        paramInfoId,
      })
    )
      output.add([match[0], match.index]);
  }
  return Array.from(output);
}

export function findCandidateTemplateVars(sectionId, value) {
  let match;
  const output = [];
  const { pattern: templateVarsRegex, fullNameToSectionId } =
    useTemplateVarRegex.getState();
  while ((match = templateVarsRegex.exec(value))) {
    // don't allow self-references
    if (fullNameToSectionId[match[0]] !== sectionId) {
      output.push([match[0], match.index]);
    }
  }
  return output;
}
