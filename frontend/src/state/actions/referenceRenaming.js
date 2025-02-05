import {
  computeInfoToFullName,
  extractTemplateVarSuffix,
  keyForInfoToFullName,
} from "components/Utils/CodeMirror/utils";
import { dbMakeEVRefTemplateVarReplacements } from "requests/infoToEVReferrer";
import { useSectionInfos, useSettings } from "state/definitions";
import { RENAME_REFERENCES_ON_SECTION_MOVE_MODES } from "utils/constants";
import { templatePrefix } from "utils/utils";
import { openRenameReferencesModal } from "./modal";
import { getSectionPathFullName } from "./sectionInfos";

function getRequiredReplacements() {
  const codeAreaReplacements = {};
  const codeInfoReplacements = {};
  const paramEVReplacements = {};
  const state = useSectionInfos.getState();
  const infoToFullName = computeInfoToFullName();
  let atLeastOneReplacement = false;
  let changed = false;

  for (const variantId of Object.keys(useSectionInfos.getState().variants)) {
    changed = setEVRefReplacements(
      variantId,
      codeAreaReplacements,
      codeInfoReplacements,
      paramEVReplacements,
      state,
      infoToFullName,
    );
    atLeastOneReplacement ||= changed;

    changed = setTemplateVarReplacements(
      variantId,
      codeAreaReplacements,
      state,
    );
    atLeastOneReplacement ||= changed;
  }

  return [
    codeAreaReplacements,
    codeInfoReplacements,
    paramEVReplacements,
    atLeastOneReplacement,
  ];
}

function setEVRefReplacements(
  variantId,
  codeAreaReplacements,
  codeInfoReplacements,
  paramEVReplacements,
  state,
  infoToFullName,
) {
  let curr, changed;
  let atLeastOneReplacement = false;

  const variant = state.variants[variantId];
  for (const originalEVRef of variant.evRefs) {
    curr = getCodeAreaReplacementObj(codeAreaReplacements, variantId, state);
    changed = getNewEVRefNameAndAddToReplacements(
      originalEVRef,
      infoToFullName,
      curr,
    );
    atLeastOneReplacement ||= changed;
  }

  if (variant.selectedItem) {
    const codeInfoId = variant.selectedItem;
    for (const originalEVRef of state.codeInfo[codeInfoId].evRefs) {
      curr = getCodeInfoReplacementObj(codeInfoReplacements, codeInfoId, state);
      changed = getNewEVRefNameAndAddToReplacements(
        originalEVRef,
        infoToFullName,
        curr,
      );
      atLeastOneReplacement ||= changed;
    }
  }

  for (const [referringParamInfoId, valueInfo] of Object.entries(
    variant.values,
  )) {
    for (const originalEVRef of valueInfo.evRefs) {
      curr = getParamEVReplacementObj(
        paramEVReplacements,
        variantId,
        referringParamInfoId,
        state,
      );
      changed = getNewEVRefNameAndAddToReplacements(
        originalEVRef,
        infoToFullName,
        curr,
      );
      atLeastOneReplacement ||= changed;
    }
  }
  return atLeastOneReplacement;
}

function getNewEVRefNameAndAddToReplacements(
  originalEVRef,
  infoToFullName,
  curr,
) {
  const newName = infoToFullName[keyForInfoToFullName(originalEVRef)];
  curr.replacements.push({ originalEVRef, newName });
  return originalEVRef.keyword !== newName;
}

function setTemplateVarReplacements(variantId, codeAreaReplacements, state) {
  let curr;
  let atLeastOneReplacement = false;
  for (const originalTemplateVar of state.variants[variantId].templateVars) {
    curr = getCodeAreaReplacementObj(codeAreaReplacements, variantId, state);
    if (originalTemplateVar.sectionId) {
      const matchingSection = Object.values(state.x).find(
        (s) => s.id === originalTemplateVar.sectionId,
      );
      if (matchingSection) {
        const suffix = extractTemplateVarSuffix(originalTemplateVar.keyword);
        // TODO: THIS IS INCORRECT
        const newName = `${templatePrefix(
          getSectionPathFullName(matchingSection.id, state),
        )}${suffix}`;
        curr.replacements.push({ originalTemplateVar, newName });
        if (originalTemplateVar.keyword !== newName) {
          atLeastOneReplacement = true;
        }
      }
    } else {
      // If it's not referring to a section, then it's a special keyword
      // like SETTA_GENERATED_PYTHON, and this doesn't need a different new name.
      curr.replacements.push({
        originalTemplateVar,
        newName: originalTemplateVar.keyword,
      });
    }
  }
  return atLeastOneReplacement;
}

function newReplacementObj(string) {
  return {
    string,
    replacements: [],
  };
}

function getParamEVReplacementObj(
  paramEVReplacements,
  variantId,
  referringParamInfoId,
  state,
) {
  if (!(variantId in paramEVReplacements)) {
    paramEVReplacements[variantId] = {};
  }
  if (!(referringParamInfoId in paramEVReplacements[variantId])) {
    paramEVReplacements[variantId][referringParamInfoId] = newReplacementObj(
      state.variants[variantId].values[referringParamInfoId].value,
    );
  }
  return paramEVReplacements[variantId][referringParamInfoId];
}

function getCodeInfoReplacementObj(codeInfoReplacements, codeInfoId, state) {
  if (!(codeInfoId in codeInfoReplacements)) {
    codeInfoReplacements[codeInfoId] = newReplacementObj(
      state.codeInfo[codeInfoId].name,
    );
  }
  return codeInfoReplacements[codeInfoId];
}

function getCodeAreaReplacementObj(codeAreaReplacements, variantId, state) {
  if (!(variantId in codeAreaReplacements)) {
    codeAreaReplacements[variantId] = newReplacementObj(
      state.variants[variantId].code,
    );
  }
  return codeAreaReplacements[variantId];
}

export async function maybeOpenRenameReferencesModal() {
  const renameMode =
    useSettings.getState().backend.renameReferencesOnSectionMoveMode;

  if (renameMode === RENAME_REFERENCES_ON_SECTION_MOVE_MODES.NEVER_RENAME) {
    return;
  }

  const [
    codeAreaReplacements,
    codeInfoReplacements,
    paramEVReplacements,
    atLeastOneReplacement,
  ] = getRequiredReplacements();

  if (!atLeastOneReplacement) {
    return;
  }

  if (renameMode === RENAME_REFERENCES_ON_SECTION_MOVE_MODES.ALWAYS_ASK) {
    openRenameReferencesModal(
      codeAreaReplacements,
      codeInfoReplacements,
      paramEVReplacements,
    );
  } else if (
    renameMode === RENAME_REFERENCES_ON_SECTION_MOVE_MODES.ALWAYS_RENAME
  ) {
    await makeReplacements(
      codeAreaReplacements,
      codeInfoReplacements,
      paramEVReplacements,
    );
  }
}

export async function makeReplacements(
  codeAreaReplacements,
  codeInfoReplacements,
  paramEVReplacements,
) {
  console.log("codeAreaReplacements", codeAreaReplacements);
  console.log("codeInfoReplacements", codeInfoReplacements);
  console.log("paramEVReplacements", paramEVReplacements);

  const res = await dbMakeEVRefTemplateVarReplacements(
    codeAreaReplacements,
    codeInfoReplacements,
    paramEVReplacements,
  );
  if (res.status === 200) {
    const { newCodeAreaValues, newCodeInfoValues, newParamEVValues } = res.data;
    useSectionInfos.setState((state) => {
      let curr;
      for (const [variantId, newData] of Object.entries(newCodeAreaValues)) {
        curr = state.variants[variantId];
        curr.code = newData[0];
        curr.evRefs = newData[1];
        curr.templateVars = newData[2];
      }
      for (const [codeInfoId, newData] of Object.entries(newCodeInfoValues)) {
        curr = state.codeInfo[codeInfoId];
        curr.name = newData[0];
        curr.evRefs = newData[1];
      }
      for (const [variantId, params] of Object.entries(newParamEVValues)) {
        for (const [referringParamInfoId, newData] of Object.entries(params)) {
          curr = state.variants[variantId].values[referringParamInfoId];
          curr.value = newData[0];
          curr.evRefs = newData[1];
        }
      }
    });
  }
}
