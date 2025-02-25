import _ from "lodash";
import { dbLoadSectionJSONSource } from "requests/jsonSource";
import { useSectionInfos } from "state/definitions";
import { updateSectionInfos } from "./sectionInfos";

export async function updateJSONSourceContents(updatedFileInfo) {
  const { absPath, relPath, destAbsPath, destRelPath, matchingGlobPatterns } =
    updatedFileInfo;

  const sectionIds = [];
  const jsonSources = [];
  for (const s of Object.values(useSectionInfos.getState().x)) {
    if (
      !(absPath && s.jsonSource === absPath) &&
      !(relPath && s.jsonSource === relPath) &&
      !(destAbsPath && s.jsonSource === destAbsPath) &&
      !(destRelPath && s.jsonSource === destRelPath) &&
      !matchingGlobPatterns.includes(s.jsonSource)
    ) {
      continue;
    }
    sectionIds.push(s.id);
    jsonSources.push(s.jsonSource);
  }

  const { sections, sectionVariants, codeInfo, codeInfoCols } =
    await loadJsonContents(sectionIds, jsonSources);

  useSectionInfos.setState((state) => {
    updateSectionInfos({
      sections,
      sectionVariants,
      codeInfo,
      codeInfoCols,
      state,
    });
  });
}

export async function loadJsonContents(sectionIds, jsonSources) {
  let codeInfo = null,
    codeInfoCols = null,
    sectionVariants = null,
    sections = null;

  const sectionIdToJSONSource = {};
  for (const [idx, s] of sectionIds.entries()) {
    if (jsonSources[idx]) {
      sectionIdToJSONSource[s] = jsonSources[idx];
    }
  }
  if (_.size(sectionIdToJSONSource) > 0) {
    const res = await dbLoadSectionJSONSource(sectionIdToJSONSource);
    if (res.status === 200) {
      ({ codeInfo, codeInfoCols, sectionVariants, sections } =
        res.data.project);
    }
  }

  return { sections, sectionVariants, codeInfo, codeInfoCols };
}
