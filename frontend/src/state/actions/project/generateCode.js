import { computeInfoToFullName } from "components/Utils/CodeMirror/utils";
import BASE_UI_TYPES from "constants/BaseUITypes.json";
import C from "constants/constants.json";
import _ from "lodash";
import { dbGetFreeTerminal } from "requests/terminals";
import { sendMessage } from "requests/websocket";
import {
  getSectionInfo,
  getSectionPathFullName,
  getSectionType,
} from "state/actions/sectionInfos";
import {
  useEVRefRegex,
  useSectionInfos,
  useTemplateVarRegex,
  useWebsocketConnectionList,
} from "state/definitions";
import { getForSectionId } from "state/hooks/paramSweep";
import {
  addTerminalInitialMessage,
  createTemporaryTerminal,
  maybeCreateTemporaryTerminalGroup,
  sendTerminalMessage,
} from "state/hooks/terminals/terminal";
import { createNewId } from "utils/idNameCreation";
import { newEVEntry } from "utils/objs/ev";
import { templatePrefix } from "utils/utils";
import { requestBase64FromCanvas } from "../temporaryMiscState";
import { generateParamSweepCombinations } from "./generateParamSweepCombinations";
import { generateSectionParamSweepVersionCombinations } from "./generateSectionParamSweepVersionCombinations";
import { getProjectData } from "./saveProject";

export async function getProjectDataToGenerateCode({
  includeFullNameToInfo = true,
  includeInfoToFullName = true,
  includeFullNameToSectionId = true,
  includeSectionPathFullNames = true,
  includeDrawings = false,
}) {
  const project = getProjectData({});
  if (includeFullNameToInfo) {
    project.fullNameToInfo = useEVRefRegex.getState().fullNameToInfo;
  }
  if (includeInfoToFullName) {
    project.infoToFullName = computeInfoToFullName(project);
  }
  if (includeFullNameToSectionId) {
    project.fullNameToSectionId =
      useTemplateVarRegex.getState().fullNameToSectionId;
  }
  if (includeSectionPathFullNames) {
    project.sectionPathFullNames = {};
    for (const s of Object.values(project.sections)) {
      project.sectionPathFullNames[s.id] = getSectionPathFullName(
        s.id,
        useSectionInfos.getState(),
      );
    }
  }
  if (includeDrawings) {
    const sectionInfosState = useSectionInfos.getState().x;
    const sections = {};
    for (const x of Object.values(sectionInfosState)) {
      const currSection = _.cloneDeep(x);
      if (getSectionType(x.id) === C.DRAW) {
        currSection.drawing = await requestBase64FromCanvas(x.id);
      }
      sections[x.id] = currSection;
    }
    project.sections = sections;
  }
  return project;
}

export async function sendRunCodeMessage(project, messageIdx = 0) {
  const codeRunId = createNewId();
  let message = {
    id: codeRunId,
    messageType: C.WS_RUN_CODE,
    content: project,
  };
  if (useWebsocketConnectionList.getState().connectedTo !== "main") {
    sendMessage(message);
    return;
  }
  const res = await dbGetFreeTerminal(project.projectConfig.id);
  if (res.status === 200) {
    const freeTerminalSectionId = res.data;
    message = JSON.stringify(message);
    if (freeTerminalSectionId) {
      sendTerminalMessage(freeTerminalSectionId, message);
    } else {
      const id = createNewId();
      addTerminalInitialMessage(id, message);
      useSectionInfos.setState((state) => {
        const groupId = maybeCreateTemporaryTerminalGroup(state);
        createTemporaryTerminal(id, groupId, state);
      });
    }
  }
}

export function* getProjectRuns(project) {
  const globalParamSweepSectionId =
    useSectionInfos.getState().singletonSections[C.GLOBAL_PARAM_SWEEP];
  const selectedRunGroupIds = globalParamSweepSectionId
    ? getSectionInfo(globalParamSweepSectionId).selectedVariantIds
    : {};
  // if there are no run groups, or no run groups are selected
  if (!globalParamSweepSectionId || _.size(selectedRunGroupIds) === 0) {
    const variant = _.cloneDeep(project);
    const paramSweepSectionVariantIds = {};
    for (const s of Object.values(variant.sections)) {
      if (s.paramSweepSectionId) {
        // add the currently selected variant id for the param sweep section
        paramSweepSectionVariantIds[s.paramSweepSectionId] =
          variant.sections[s.paramSweepSectionId].variantId;
      }
    }
    variant.runCodeBlocks = getRunCodeBlocks(project, false);
    yield* getProjectVariants(variant, paramSweepSectionVariantIds);
  } else {
    for (const runGroupId of Object.keys(selectedRunGroupIds)) {
      const runGroup = useSectionInfos.getState().variants[runGroupId].runGroup;
      const sectionParamSweepsAndVersions = getSectionsParamSweepsAndVersions(
        project,
        runGroup,
        Object.keys(project.projectConfig.children),
        null,
      );

      for (const combo of generateSectionParamSweepVersionCombinations(
        sectionParamSweepsAndVersions,
      )) {
        const variant = _.cloneDeep(project);
        // filter top-level sections
        variant.projectConfig.children = _.pick(
          variant.projectConfig.children,
          combo.map((x) => x.sectionId),
        );
        // filter all sections
        variant.sections = _.pick(
          variant.sections,
          combo.map((x) => x.sectionId),
        );
        // filter children list in every variant
        for (const sv of Object.values(variant.sectionVariants)) {
          sv.children = sv.children.filter((x) => x in variant.sections);
        }
        // set every selected section's variantId
        for (const c of combo) {
          if (c.versionId) {
            variant.sections[c.sectionId].variantId = c.versionId;
          }
        }

        const paramSweepSectionVariantIds = {};
        for (const c of combo) {
          if (c.paramSweepId) {
            const { paramSweepSectionId } = variant.sections[c.sectionId];
            paramSweepSectionVariantIds[paramSweepSectionId] = c.paramSweepId;
          }
        }
        variant.runCodeBlocks = getRunCodeBlocks(project, true);
        yield* getProjectVariants(variant, paramSweepSectionVariantIds);
      }
    }
  }
}

function getSectionsParamSweepsAndVersions(
  project,
  runGroupSections,
  sectionIds,
  variantId,
) {
  const sectionParamSweepsAndVersions = [];
  for (const sectionId of sectionIds) {
    const sectionDetails = runGroupSections[sectionId]?.[variantId];
    // is it selected for the given variantId?
    if (!sectionDetails || !sectionDetails.selected) {
      continue;
    }

    let paramSweepWasAdded = false;
    const currentlySelectedVariantId = project.sections[sectionId].variantId;
    for (const [paramSweepId, selected] of Object.entries(
      sectionDetails.paramSweeps,
    )) {
      if (selected) {
        sectionParamSweepsAndVersions.push({
          sectionId,
          paramSweepId,
          versionId: currentlySelectedVariantId,
          parentVersionId: variantId,
        });
        paramSweepWasAdded = true;
      }
    }

    for (const [versionId, selected] of Object.entries(
      sectionDetails.versions,
    )) {
      if (selected) {
        // add the currently selected version if a param sweep wasn't added
        if (versionId !== currentlySelectedVariantId || !paramSweepWasAdded) {
          sectionParamSweepsAndVersions.push({
            sectionId,
            paramSweepId: null,
            versionId,
            parentVersionId: variantId,
          });
        }
        const childSectionIds = project.sectionVariants[versionId].children;
        sectionParamSweepsAndVersions.push(
          ...getSectionsParamSweepsAndVersions(
            project,
            runGroupSections,
            childSectionIds,
            versionId,
          ),
        );
      }
    }
  }

  return sectionParamSweepsAndVersions;
}

function* getProjectVariants(project, paramSweepSectionVariantIds) {
  const allSweeps = [];
  for (const [paramSweepSectionId, variantId] of Object.entries(
    paramSweepSectionVariantIds,
  )) {
    for (const s of project.sectionVariants[variantId].sweep) {
      s.params = s.params.filter((x) => x.paramInfoId);
      allSweeps.push({ paramSweepSectionId, variantId, ...s });
    }
  }

  if (allSweeps.length > 0) {
    for (const combo of generateParamSweepCombinations(allSweeps)) {
      const variant = _.cloneDeep(project);
      for (const parts of combo) {
        const { paramSweepSectionId, selectedItem, paramInfoId, value } = parts;
        const forSectionId = getForSectionId(
          paramSweepSectionId,
          project.sections,
        );
        const { variantId: forSectionVariantId } =
          project.sections[forSectionId];
        const sectionVariant = variant.sectionVariants[forSectionVariantId];
        sectionVariant.selectedItem = selectedItem;
        if (paramInfoId) {
          const evEntry = sectionVariant.values[paramInfoId] ?? newEVEntry();
          evEntry.value = value;
          sectionVariant.values[paramInfoId] = evEntry;
        }
      }
      yield variant;
    }
  } else {
    yield project;
  }
}

// TODO: refine this logic. Has to be really clear what happens in each case.
function getRunCodeBlocks(project, isRunGroup) {
  if (isRunGroup) {
    // use all code sections when running a run group
    const ids = [];
    for (const s of Object.values(project.sections)) {
      const sectionType =
        project.uiTypes[s.uiTypeId]?.type ?? BASE_UI_TYPES[s.uiTypeId].type;
      if (sectionType === C.CODE) {
        ids.push(s.id);
      }
    }
    if (ids.length > 0) {
      return ids;
    }
  } else {
    // use only the section with the gen code template var
    for (const s of Object.values(project.sections)) {
      const templateVars = project.sectionVariants[s.variantId].templateVars;
      const genCodeTemplateVar = templateVars.find(
        (t) => t.keyword === templatePrefix(C.SETTA_GENERATED_PYTHON),
      );
      if (genCodeTemplateVar) {
        return [s.id];
      }
    }
  }
  // otherwise the backend will figure out something
  return null;
}
