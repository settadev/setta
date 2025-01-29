import C from "constants/constants.json";
import _ from "lodash";
import { useSectionInfos } from "state/definitions";
import { getSectionType } from "../sectionInfos";
import { requestBase64FromCanvas } from "../temporaryMiscState";
import { getProjectDataToGenerateCode } from "./generateCode";

export async function getProjectDataForInteractive() {
  const project = getProjectDataToGenerateCode({});
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
  return project;
}
