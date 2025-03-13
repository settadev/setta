import { findCandidateTemplateVars } from "components/Utils/CodeMirror/utils";
import C from "constants/constants.json";
import { getProjectData } from "state/actions/project/saveProject";
import { getSectionType, getSectionVariant } from "state/actions/sectionInfos";
import { useSectionInfos } from "state/definitions";
import { post } from "./utils";

export async function dbImportCodeBlocks(projects) {
  return await post({
    body: { projects },
    address: C.ROUTE_UPDATE_INTERACTIVE_CODE,
  });
}

export async function dbSendProjectToInteractiveCode(projects) {
  return await post({
    body: { projects },
    address: C.ROUTE_SEND_PROJECT_TO_INTERACTIVE_CODE,
  });
}

export async function dbKillInMemorySubprocesses() {
  const { id: projectConfigId } = useSectionInfos.getState().projectConfig;
  return await post({
    body: { projectConfigId },
    address: C.ROUTE_KILL_IN_MEMORY_SUBPROCESSES,
  });
}

export async function dbFormateCode() {
  const project = getProjectData({});
  const candidateTemplateVars = {};
  for (const s of Object.values(project.sections)) {
    if (getSectionType(s.id) === C.CODE) {
      candidateTemplateVars[s.id] = findCandidateTemplateVars(
        s.id,
        getSectionVariant(s.id).code,
      );
    }
  }
  return await post({
    body: { project, candidateTemplateVars },
    address: C.ROUTE_FORMAT_CODE,
  });
}
