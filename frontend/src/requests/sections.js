import {
  constructEVRefs,
  constructTemplateVars,
  findCandidateEVRefs,
  findCandidateTemplateVars,
} from "components/Utils/CodeMirror/utils";
import C from "constants/constants.json";
import { setNotificationMessage } from "state/actions/notification";
import { getProjectDataToGenerateCode } from "state/actions/project/generateCode";
import { getSectionInfo } from "state/actions/sectionInfos";
import { sendMessageAndWait } from "state/actions/temporaryMiscState";
import { useSectionInfos, useTypeErrors } from "state/definitions";
import { createNewId } from "utils/idNameCreation";
import { asyncDebounce } from "utils/utils";
import { sendMessage } from "./websocket";

export async function dbRequestTypeCheck(userRequested = false) {
  if (userRequested) {
    setNotificationMessage("Checking types...");
    useTypeErrors.setState({ userRequested });
  }
  const project = await getProjectDataToGenerateCode({});
  sendMessage({
    content: project,
    id: createNewId(),
    messageType: "typeCheck",
  });
}

export const debouncedTypeCheckRequest = asyncDebounce(dbRequestTypeCheck, 500);

export async function dbParametersRequest({ sectionId, fullText, position }) {
  return await dbTextFieldCompletion({
    sectionId,
    paramInfoId: null,
    fullText,
    position,
    messageType: "parametersRequest",
  });
}

export async function dbTextFieldInitializeCode({ sectionId, paramInfoId }) {
  const project = await getProjectDataToGenerateCode({});
  await sendMessage({
    id: createNewId(),
    messageType: "textFieldInitializeCode",
    content: { project, sectionId, paramInfoId },
  });
}

export async function dbCodeAreaInitializeCode(sectionId) {
  const project = await getProjectDataToGenerateCode({});
  return await sendMessageAndWait({
    id: createNewId(),
    messageType: "codeAreaInitializeCode",
    content: { project, sectionId },
  });
}

export async function dbCodeAreaCompletion({
  sectionId,
  fullText,
  position,
  codeLanguage,
}) {
  const { id: projectConfigId, name: projectConfigName } =
    useSectionInfos.getState().projectConfig;
  const { name: sectionName } = getSectionInfo(sectionId);

  const candidateEVRefs = findCandidateEVRefs({
    sectionId,
    paramInfoId: null,
    value: fullText,
    regexPatternKey: "codeAreaPattern",
  });

  const candidateTemplateVars = findCandidateTemplateVars(sectionId, fullText);

  const autoCompleteProps = {
    id: createNewId(),
    messageType: "codeAreaAutocomplete",
    content: {
      projectConfigId,
      projectConfigName,
      codeLanguage,
      sectionId,
      sectionName,
      fullText,
      position,
      candidateEVRefs,
      candidateTemplateVars,
    },
  };

  const res = await sendMessageAndWait(autoCompleteProps);

  if (res.data === C.CODE_AREA_GEN_CODE_NOT_INITIALIZED) {
    const res2 = await dbCodeAreaInitializeCode(sectionId);
    if (res2.data) {
      return await sendMessageAndWait(autoCompleteProps);
    } else {
      return [];
    }
  }
  return res;
}

export async function dbTextFieldCompletion({
  sectionId,
  paramInfoId,
  fullText,
  position,
  messageType = "textFieldCompletion",
}) {
  const { id: projectConfigId, name: projectConfigName } =
    useSectionInfos.getState().projectConfig;

  const candidateEVRefs = findCandidateEVRefs({
    sectionId,
    paramInfoId,
    value: fullText,
    regexPatternKey: "pattern",
  });

  return await sendMessageAndWait({
    id: createNewId(),
    messageType,
    content: {
      projectConfigId,
      projectConfigName,
      sectionId,
      paramInfoId,
      fullText,
      position,
      candidateEVRefs,
    },
  });
}

export async function getEVRefs({
  sectionId,
  paramInfoId,
  fullText,
  regexPatternKey = "pattern",
  templateVars = null,
  onlyAfterGenCodeTemplateVar = false,
}) {
  let evRefs = [];
  let keywordPositions = [];
  const candidateEVRefs = findCandidateEVRefs({
    sectionId,
    paramInfoId,
    value: fullText,
    regexPatternKey,
  });
  if (candidateEVRefs.length > 0) {
    let count = 0;
    keywordPositions = [];
    await sendMessageAndWait({
      id: createNewId(),
      messageType: "findEVRefs",
      content: {
        sectionId,
        paramInfoId,
        candidateEVRefs,
        fullText,
        templateVars,
        onlyAfterGenCodeTemplateVar,
      },
      condition: ({ data: { positions, numMessages } }) => {
        keywordPositions.push(...positions);
        count += 1;
        return count === numMessages;
      },
    });

    // CodeMirror's RangeSetBuilder needs the list to be sorted
    keywordPositions.sort((a, b) => a.startPos - b.startPos);

    evRefs = constructEVRefs(keywordPositions, fullText);
  }

  return evRefs;
}

async function getTemplateVars(sectionId, fullText) {
  let templateVars = [];
  let keywordPositions = [];
  const candidateTemplateVars = findCandidateTemplateVars(sectionId, fullText);
  if (candidateTemplateVars.length > 0) {
    let count = 0;
    keywordPositions = [];
    await sendMessageAndWait({
      id: createNewId(),
      messageType: "codeAreaFindTemplateVars",
      content: { sectionId, candidateTemplateVars, fullText },
      condition: ({ data: { positions, numMessages } }) => {
        if (positions !== null) {
          keywordPositions.push(...positions);
        }
        count += 1;
        return count === numMessages;
      },
    });

    // CodeMirror's RangeSetBuilder needs the list to be sorted
    keywordPositions.sort((a, b) => a.startPos - b.startPos);

    templateVars = constructTemplateVars(keywordPositions, fullText);
  }

  return templateVars;
}

export async function getEVRefsAndTemplateVarsForCodeArea(sectionId, value) {
  const templateVars = await getTemplateVars(sectionId, value);

  const evRefs = await getEVRefs({
    sectionId,
    paramInfoId: null,
    fullText: value,
    regexPatternKey: "codeAreaPattern",
    templateVars,
    onlyAfterGenCodeTemplateVar: true,
  });

  return { templateVars, evRefs };
}
