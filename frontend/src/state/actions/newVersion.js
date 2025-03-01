import { dbNewVersionFilename } from "requests/sectionVariants";
import { setNotificationMessage } from "state/actions/notification";
import {
  duplicateCodeInfoCol,
  getSectionInfo,
} from "state/actions/sectionInfos";
import { useSectionInfos } from "state/definitions";
import { createRandomName } from "utils/idNameCreation";
import { maybeRunGuiToYaml } from "./guiToYaml";
import { duplicateSectionVariant, getSectionVariant } from "./sectionInfos";

export function createNewVersion(sectionId, newVersionName, state) {
  const { variantId: currVariantId } = state.x[sectionId];
  const currCodeInfoColId = getSectionVariant(sectionId, state).codeInfoColId;
  const newCodeInfoColId = currCodeInfoColId
    ? duplicateCodeInfoCol(currCodeInfoColId, state)
    : null;
  const newVariantId = duplicateSectionVariant(
    currVariantId,
    newVersionName,
    newCodeInfoColId,
    state,
  );
  state.x[sectionId].variantId = newVariantId;
  state.x[sectionId].variantIds.push(newVariantId);
  return { newVariantId, oldVariantId: currVariantId };
}

async function maybeSaveNewJSONVersion(newVariantId, isJsonSource) {
  if (isJsonSource) {
    await dbSaveSectionJSONSource(newVariantId);
  }
  setNotificationMessage("New Version Created");
}

async function createNewVersionName(currName, isJsonSource, jsonSourceGlob) {
  if (isJsonSource) {
    const res = await dbNewVersionFilename(currName, jsonSourceGlob);
    if (res.status === 200) {
      return res.data;
    }
  }
  return createRandomName();
}

export async function createNewVersionMaybeWithJSON(sectionId) {
  const { jsonSourceGlob } = getSectionInfo(sectionId);
  const { name, isJsonSource } = getSectionVariant(sectionId);
  const newVersionName = await createNewVersionName(
    name,
    isJsonSource,
    jsonSourceGlob,
  );
  let newVariantId;
  useSectionInfos.setState((state) => {
    ({ newVariantId } = createNewVersion(sectionId, newVersionName, state));
  });
  maybeRunGuiToYaml(sectionId, newVariantId);
  maybeSaveNewJSONVersion(newVariantId, isJsonSource);
}
