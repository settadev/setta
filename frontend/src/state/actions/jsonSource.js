import { dbLoadSectionJSONSource } from "requests/jsonSource";
import { useSectionInfos } from "state/definitions";
import { updateSectionInfos } from "./sectionInfos";

export async function updateJSONSourceContents(updatedFileInfo) {
  const { absPath, relPath, destAbsPath, destRelPath } = updatedFileInfo;

  const info = {
    sections: {},
    codeInfo: {},
    codeInfoCols: {},
    sectionVariants: {},
  };

  for (const s of Object.values(useSectionInfos.getState().x)) {
    if (
      !(absPath && s.jsonSource === absPath) &&
      !(relPath && s.jsonSource === relPath) &&
      !(destAbsPath && s.jsonSource === destAbsPath) &&
      !(destRelPath && s.jsonSource === destRelPath)
    ) {
      continue;
    }
    const { sections, sectionVariants, codeInfo, codeInfoCols } =
      await loadJsonContents(s.id, s.jsonSource);

    Object.assign(info.sections, sections);
    Object.assign(info.sectionVariants, sectionVariants);
    Object.assign(info.codeInfo, codeInfo);
    Object.assign(info.codeInfoCols, codeInfoCols);
  }

  useSectionInfos.setState((state) => {
    updateSectionInfos({
      sections: info.sections,
      sectionVariants: info.sectionVariants,
      codeInfo: info.codeInfo,
      codeInfoCols: info.codeInfoCols,
      state,
    });
  });
}

export async function loadJsonContents(sectionId, jsonSource) {
  let codeInfo = null,
    codeInfoCols = null,
    sectionVariants = null,
    sections = null;

  if (jsonSource) {
    const res = await dbLoadSectionJSONSource(sectionId, jsonSource);
    if (res.status === 200) {
      ({ codeInfo, codeInfoCols, sectionVariants, sections } =
        res.data.project);
    }
  }

  return { sections, sectionVariants, codeInfo, codeInfoCols };
}
