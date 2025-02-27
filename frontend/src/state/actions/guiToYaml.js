import C from "constants/constants.json";
import _ from "lodash";
import { dbGuiToYaml } from "requests/guiToYaml";
import {
  getCodeInfoCol,
  getDisplayedSectionVariantId,
  getSectionInfo,
  getSectionType,
  getSectionVariant,
  setEnteredValue,
} from "state/actions/sectionInfos";
import {
  useOriginalYamlObj,
  useSectionInfos,
  useYamlValue,
} from "state/definitions";
import { getForSectionId } from "state/hooks/paramSweep";
import { SECTION_DISPLAY_MODES } from "utils/constants";
import { findAllParametersAndPathMaps } from "utils/getDescendants";
import { createNewId } from "utils/idNameCreation";
import { newEVEntry } from "utils/objs/ev";
import { parseAllDocuments } from "yaml";
import {
  getOrCreateCodeInfoCol,
  newCodeInfoMaybeWithJsonSource,
} from "./codeInfo";
import { parseRawDump, splitDocuments } from "./guiToYamlParsing";
import { getCodeChildrenAndParentCodeInfoId } from "./sectionInfos";
import { paramNameFromPathArray } from "./sections/sectionContents";

export async function guiToYaml(sectionId, variantId) {
  const res = await dbGuiToYaml(sectionId, variantId);
  if (res.status === 200) {
    const { originalObj, yamlValue } = res.data;
    useOriginalYamlObj.setState({
      [variantId]: originalObj,
    });
    useYamlValue.setState({ [variantId]: yamlValue });
  }
}

export function yamlToGUI(sectionId) {
  const variantId = useSectionInfos.getState().x[sectionId].variantId;
  const sectionType = getSectionType(sectionId);
  const yamlValue = useYamlValue.getState()[variantId] ?? "";
  switch (sectionType) {
    case C.PARAM_SWEEP:
      paramSweepSectionYamlToGUI(sectionId, yamlValue);
      break;
    case C.GLOBAL_PARAM_SWEEP:
      globalParamSweepSectionYamlToGUI(yamlValue, variantId);
      break;
    case C.GLOBAL_VARIABLES:
    case C.SECTION:
      const originalObj = useOriginalYamlObj.getState()[variantId] ?? {};
      sectionYamlToGUI(sectionId, yamlValue, originalObj);
      break;
  }
}

function paramSweepSectionYamlToGUI(sectionId, yamlValue) {
  const state = useSectionInfos.getState();
  const forSectionId = getForSectionId(sectionId, state.x);
  const documents = splitDocuments(yamlValue);
  const parsedDocs = documents.map((doc) =>
    doc.trim() ? parseRawDump(doc) : {},
  );
  const codeInfoChildren = getCodeInfoCol(forSectionId, state).children;
  const codeInfoChildrenKeys = Object.keys(codeInfoChildren);
  const newParamSweep = [];

  for (const d of parsedDocs) {
    const hasCallable = !Array.isArray(d);
    let matchingCallableId = null,
      callableName;
    if (hasCallable) {
      callableName = Object.keys(d)[0];
      if (!callableName) {
        newParamSweep.push({ selectedItem: null, params: [] });
        continue;
      }

      matchingCallableId = tryFindingMatchingId(
        callableName,
        codeInfoChildrenKeys,
        state.codeInfo,
      );
      if (!matchingCallableId) {
        continue;
      }
    }

    const { pathMap } = findAllParametersAndPathMaps({
      allCodeInfo: state.codeInfo,
      codeInfoChildren,
      startingId: matchingCallableId,
    });

    let paramsInDoc = callableName ? d[callableName] : d;
    // Usually this is a list.
    // But if it's just "empty" then it'll be an empty dict.
    // Hence why I'm using _.size
    if (_.size(paramsInDoc) === 0) {
      paramsInDoc = [];
    }

    const params = [];

    for (const singleParam of paramsInDoc) {
      const paramName = Object.keys(singleParam)[0];
      let matchingParamId;
      for (const id of Object.keys(pathMap)) {
        if (paramNameFromPathArray(state.codeInfo, pathMap, id) === paramName) {
          matchingParamId = id;
          break;
        }
      }
      if (!matchingParamId) {
        continue;
      }
      const values = singleParam[paramName];
      if (_.size(values) > 0) {
        params.push({
          paramInfoId: matchingParamId,
          values,
        });
      }
    }

    newParamSweep.push({ selectedItem: matchingCallableId, params });
  }

  useSectionInfos.setState((x) => {
    getSectionVariant(sectionId, x).sweep = newParamSweep;
  });
}

function tryFindingMatchingId(name, codeInfoChildrenKeys, codeInfo) {
  return codeInfoChildrenKeys.find((x) => codeInfo[x]?.name === name);
}

function globalParamSweepSectionYamlToGUI(yamlValue, runGroupId) {
  const doc = parseAllDocuments(yamlValue)[0].toJS();
  const state = useSectionInfos.getState();
  const sections = state.x;
  const sectionVariants = state.variants;
  const newRunGroupSections = {};

  for (const [k, v] of Object.entries(doc)) {
    recursiveHelper(
      k,
      v,
      sections,
      sectionVariants,
      newRunGroupSections,
      null,
      null,
    );
  }

  useSectionInfos.setState((x) => {
    x.variants[runGroupId].runGroup = newRunGroupSections;
  });
}

function recursiveHelper(
  name,
  value,
  sections,
  sectionVariants,
  newRunGroupSections,
  forSectionId,
  parentVariantId,
) {
  let nextForSectionId = forSectionId;
  let nextParentVariantId = parentVariantId;
  const [match, type] = getMatch(name, forSectionId, sections, sectionVariants);
  if (type === "section") {
    if (!(match in newRunGroupSections)) {
      newRunGroupSections[match] = {};
    }
    newRunGroupSections[match][parentVariantId] = {
      selected: true,
      versions: {},
      paramSweeps: {},
    };
    nextForSectionId = match;
  } else if (type === "sectionVariant") {
    newRunGroupSections[forSectionId][parentVariantId].versions[match] = true;
    nextParentVariantId = match;
  } else if (type === "paramSweep") {
    newRunGroupSections[forSectionId][parentVariantId].paramSweeps[match] =
      true;
  }

  if (value) {
    // do param sweeps first, because they need to be registered with the current parentVariantId
    for (const [k, v] of Object.entries(
      _.pickBy(value, (innerV, innerK) => innerK.startsWith("~")),
    )) {
      recursiveHelper(
        k,
        v,
        sections,
        sectionVariants,
        newRunGroupSections,
        nextForSectionId,
        nextParentVariantId,
      );
    }
  }

  if (type === "section") {
    // if a section doesn't have any children
    // or if none of the children start with @
    // then we need to select the section's only version here because it won't be
    // covered recursively
    if (!value || !Object.keys(value).some((k) => k.startsWith("@"))) {
      nextParentVariantId = sections[match].variantId;
      newRunGroupSections[match][parentVariantId].versions[
        nextParentVariantId
      ] = true;
    }
  }

  if (!value) {
    return;
  }

  // do sections and variants
  for (const [k, v] of Object.entries(
    _.pickBy(value, (innerV, innerK) => !innerK.startsWith("~")),
  )) {
    recursiveHelper(
      k,
      v,
      sections,
      sectionVariants,
      newRunGroupSections,
      nextForSectionId,
      nextParentVariantId,
    );
  }
}

function getMatch(name, forSectionId, sections, sectionVariants) {
  let match, type;
  if (forSectionId && name.startsWith("@")) {
    const searchName = name.slice(1);
    for (const v of sections[forSectionId].variantIds) {
      if (sectionVariants[v].name === searchName) {
        match = v;
        type = "sectionVariant";
        break;
      }
    }
  } else if (forSectionId && name.startsWith("~")) {
    const searchName = name.slice(1);
    const { paramSweepSectionId } = sections[forSectionId];
    for (const v of sections[paramSweepSectionId].variantIds) {
      if (sectionVariants[v].name === searchName) {
        match = v;
        type = "paramSweep";
        break;
      }
    }
  } else if (forSectionId) {
    for (const v of sectionVariants[sections[forSectionId].variantId]
      .children) {
      if (sections[v].name === name) {
        match = v;
        type = "section";
        break;
      }
    }
  } else {
    for (const v of Object.values(sections)) {
      if (v.name === name) {
        match = v.id;
        type = "section";
        break;
      }
    }
  }
  return [match, type];
}

function sectionYamlToGUI(sectionId, yamlValue, originalObj) {
  const state = useSectionInfos.getState();
  const documents = splitDocuments(yamlValue);
  let selectedItemName = null;
  let pinned = {};
  let unpinned = {};
  if (documents.length === 3) {
    [selectedItemName, pinned, unpinned] = documents;
  } else if (documents.length === 2) {
    [pinned, unpinned] = documents;
  } else {
    [unpinned] = documents;
  }
  try {
    pinned = pinned.trim?.() ? parseRawDump(pinned) : {};
    unpinned = unpinned.trim?.() ? parseRawDump(unpinned) : {};
  } catch {
    // this will happen if the yaml is not in the expected format
    return;
  }

  const fOriginalObj = mergePinnedAndUnpinned(
    flattenObject(originalObj.pinned),
    flattenObject(originalObj.unpinned),
  );
  const fNewObj = mergePinnedAndUnpinned(
    flattenObject(pinned, true),
    flattenObject(unpinned, true),
  );

  const output = [];
  const usedOriginalIds = new Set();
  const usedPaths = new Set();

  // match by key
  for (const v of fOriginalObj) {
    if (usedOriginalIds.has(v.id)) {
      continue;
    }
    let matches = fNewObj.filter(
      (x) => x.key === v.key && !usedPaths.has(JSON.stringify(x.keyPath)),
    );
    if (matches.length > 0) {
      sortPathsBySimilarity(matches, v.keyPath);
      updateOutputs({ v, matches, usedOriginalIds, usedPaths, output });
    }
  }

  // match by value
  // maybe this can be improved, like match by value + number of children
  for (const v of fOriginalObj) {
    if (usedOriginalIds.has(v.id)) {
      continue;
    }
    let matches = fNewObj.filter(
      (x) => x.value === v.value && !usedPaths.has(JSON.stringify(x.keyPath)),
    );
    if (matches.length > 0) {
      sortPathsBySimilarity(matches, v.keyPath);
      updateOutputs({ v, matches, usedOriginalIds, usedPaths, output });
    }
  }

  // add remaining new entries
  for (const v of fNewObj) {
    if (usedPaths.has(JSON.stringify(v.keyPath))) {
      continue;
    }
    const curr = {
      key: v.key,
      keyPath: v.keyPath,
      value: v.value,
      isPinned: v.isPinned,
    };
    curr.id = createNewId();
    curr.isNewParam = true;
    output.push(curr);
  }

  const keyPathToIndex = {};
  for (const [idx, v] of fNewObj.entries()) {
    keyPathToIndex[JSON.stringify(v.keyPath)] = idx;
  }

  output.sort((a, b) => {
    const indexA = keyPathToIndex[JSON.stringify(a.keyPath)];
    const indexB = keyPathToIndex[JSON.stringify(b.keyPath)];
    return indexA - indexB;
  });

  //TODO: what should editing selectedName do? The following assumes it has no effect.
  const { parentCodeInfoId } = getCodeChildrenAndParentCodeInfoId(
    sectionId,
    state,
  );
  const idsToChildren = { [parentCodeInfoId]: [] };
  for (const v of output) {
    idsToChildren[v.id] = [];
  }

  // process everything except pinned parameters that already exist
  updateIdsToChildren({
    sectionId,
    idsToChildren,
    output,
    toProcess: output.filter((v) => !(v.isPinned && !v.isNewParam)),
    inputParentId: parentCodeInfoId,
    insertAtOriginalIdx: false,
  });

  // pinned parameters that already exist should be inserted at their original indices
  updateIdsToChildren({
    sectionId,
    idsToChildren,
    output,
    toProcess: output.filter((v) => v.isPinned && !v.isNewParam),
    inputParentId: parentCodeInfoId,
    insertAtOriginalIdx: true,
  });

  const cState = state.codeInfo;
  const newInfos = {};
  const updatedInfos = {};
  const paramInfoIdToValue = {};
  const defaultValue = newEVEntry().value;
  for (const v of output) {
    if (!(v.id in cState)) {
      newInfos[v.id] = newCodeInfoMaybeWithJsonSource(
        {
          id: v.id,
          name: v.key,
          editable: v.editable ?? true,
          rcType: C.PARAMETER,
          isPinned: v.isPinned,
        },
        sectionId,
        useSectionInfos.getState(),
      );
    } else {
      updatedInfos[v.id] = { name: v.key, isPinned: v.isPinned };
    }
    if (v.value !== defaultValue) {
      paramInfoIdToValue[v.id] = v.value;
    }
  }

  useSectionInfos.setState((x) => {
    x.codeInfo = { ...x.codeInfo, ...newInfos };
    for (const [id, newAttrs] of Object.entries(updatedInfos)) {
      for (const [k, v] of Object.entries(newAttrs)) {
        x.codeInfo[id][k] = v;
      }
    }

    const variantId = x.x[sectionId].variantId;
    const variant = x.variants[variantId];
    for (const [id, newChildren] of Object.entries(idsToChildren)) {
      getOrCreateCodeInfoCol(variant, x).children[id] = newChildren;
    }

    for (const [id, value] of Object.entries(paramInfoIdToValue)) {
      setEnteredValue(variantId, id, value, x);
    }
  });
}

function updateOutputs({ v, matches, usedOriginalIds, usedPaths, output }) {
  const curr = {
    key: matches[0].key,
    keyPath: matches[0].keyPath,
    value: matches[0].value,
    isPinned: matches[0].isPinned,
  };
  curr.id = v.id;
  curr.editable = v.editable;
  output.push(curr);
  usedOriginalIds.add(v.id);
  usedPaths.add(JSON.stringify(curr.keyPath));
}

function flattenObject(obj, isPrettyObj = false) {
  let result = [];

  function flatten(id, item, editable, keyPath) {
    if (typeof item === "object" && !Array.isArray(item) && item !== null) {
      if (keyPath.length > 0) {
        result.push({
          id,
          keyPath,
          value: null,
          editable,
          key: keyPath[keyPath.length - 1],
        });
      }
      for (const [key, value] of Object.entries(item)) {
        const newKeyPath = [...keyPath, key];
        if (isPrettyObj) {
          flatten(null, value, null, newKeyPath);
        } else {
          flatten(value.id, value.value, value.editable, newKeyPath);
        }
      }
    } else {
      result.push({
        id,
        keyPath,
        value: item,
        editable,
        key: keyPath[keyPath.length - 1],
      });
    }
  }

  flatten(null, obj, null, []);
  return result;
}

// Function to calculate similarity between two YAML paths
function calculatePathSimilarity(path1, path2) {
  const minLength = Math.min(path1.length, path2.length);
  const maxLength = Math.max(path1.length, path2.length);
  let commonElements = 0;

  for (let i = 0; i < minLength; i++) {
    if (path1[path1.length - 1 - i] === path2[path2.length - 1 - i]) {
      commonElements++;
    } else {
      break;
    }
  }

  // Similarity is based on common elements from the end and penalized for length difference
  return (commonElements / maxLength) * (minLength / maxLength);
}

// Function to sort list of YAML paths based on similarity to reference path
function sortPathsBySimilarity(matches, referencePath) {
  return matches.sort((a, b) => {
    const similarityA = calculatePathSimilarity(a.keyPath, referencePath);
    const similarityB = calculatePathSimilarity(b.keyPath, referencePath);
    return similarityB - similarityA; // Sort in descending order of similarity
  });
}

function mergePinnedAndUnpinned(pinned, unpinned) {
  for (const p of unpinned) {
    p.isPinned = false;
  }

  const pinnedNotInUnpinned = [];
  for (const p of pinned) {
    const match = unpinned.find((x) => _.isEqual(x.keyPath, p.keyPath));
    if (!match) {
      pinnedNotInUnpinned.push({ ...p, isPinned: true });
    }
  }

  return [...pinnedNotInUnpinned, ...unpinned];
}

function updateIdsToChildren({
  sectionId,
  idsToChildren,
  output,
  toProcess,
  inputParentId,
  insertAtOriginalIdx,
}) {
  for (const v of toProcess) {
    let parentId = inputParentId;

    if (v.keyPath.length > 1) {
      // find parent
      const match = _.find(output, (x) =>
        _.isEqual(x.keyPath, v.keyPath.slice(0, -1)),
      );
      if (match) {
        parentId = match.id;
      } else {
        continue;
      }
    }

    if (insertAtOriginalIdx) {
      const originalIdx = getCodeInfoCol(sectionId).children[parentId].indexOf(
        v.id,
      );
      idsToChildren[parentId].splice(originalIdx, 0, v.id);
    } else {
      idsToChildren[parentId].push(v.id);
    }
  }
}

export async function maybeRunGuiToYaml(sectionId, variantId) {
  if (getSectionInfo(sectionId).displayMode === SECTION_DISPLAY_MODES.YAML) {
    await guiToYaml(sectionId, variantId);
  }
}

export async function maybeRunGuiToYamlOnAllSections(isPreview = false) {
  const state = useSectionInfos.getState();
  for (const [sectionId, section] of Object.entries(state.x)) {
    const variantId = isPreview
      ? getDisplayedSectionVariantId(sectionId)
      : section.variantId;
    await maybeRunGuiToYaml(sectionId, variantId);
  }
}
