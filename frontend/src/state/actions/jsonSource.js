import { dbLoadSectionJSONSource } from "requests/jsonSource";
import { useSectionInfos } from "state/definitions";
import { updateSectionInfos } from "./sectionInfos";

export async function updateJSONSourceContents(updatedFileInfo) {
  const { absPath, relPath, destAbsPath, destRelPath, matchingGlobPatterns } =
    updatedFileInfo;

  const variantIdsToLoad = [];
  for (const [id, v] of Object.entries(useSectionInfos.getState().variants)) {
    if (!v.isJsonSource) {
      continue;
    }

    if (
      !(absPath && v.name === absPath) &&
      !(relPath && v.name === relPath) &&
      !(destAbsPath && v.name === destAbsPath) &&
      !(destRelPath && v.name === destRelPath)
    ) {
      continue;
    }
    variantIdsToLoad.push(id);
  }

  const { sectionVariants, codeInfo, codeInfoCols } =
    await loadJsonContents(variantIdsToLoad);

  useSectionInfos.setState((state) => {
    updateSectionInfos({
      sectionVariants,
      codeInfo,
      codeInfoCols,
      state,
    });
  });
}

export async function loadJsonContents(variantIdsToLoad) {
  let codeInfo = null,
    codeInfoCols = null,
    sectionVariants = null;

  if (variantIdsToLoad.length > 0) {
    const res = await dbLoadSectionJSONSource(variantIdsToLoad);
    if (res.status === 200) {
      ({ codeInfo, codeInfoCols, sectionVariants } = res.data.project);
    }
  }

  return { sectionVariants, codeInfo, codeInfoCols };
}
