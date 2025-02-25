import C from "constants/constants.json";
import { useSectionInfos } from "state/definitions";
import { newEVEntry } from "utils/objs/ev";
import { getSectionVariant } from "./sectionInfos";

export function updateJSONSourceContents(updatedFileInfo) {
  const { absPath, relPath, destAbsPath, destRelPath, fileContent } =
    updatedFileInfo;
  const newJson = JSON.parse(fileContent);
  console.log("newJson", newJson);

  useSectionInfos.setState((state) => {
    for (const s of Object.values(state.x)) {
      if (
        !(absPath && s.jsonSource === absPath) &&
        !(relPath && s.jsonSource === relPath) &&
        !(destAbsPath && s.jsonSource === destAbsPath) &&
        !(destRelPath && s.jsonSource === destRelPath)
      ) {
        continue;
      }
      const variant = getSectionVariant(s.id, state);
      const idsToRemove = [];

      for (const [codeInfoId, value] of Object.entries(variant.values)) {
        if (isFromJsonSource(codeInfoId)) {
          const metadata = JSON.parse(
            codeInfoId.replace(C.JSON_SOURCE_PREFIX, ""),
          );
          let currVal = newJson;
          let keyNotPresent = false;
          for (const k of metadata.key) {
            if (currVal && k in currVal) {
              currVal = currVal[k];
            } else {
              keyNotPresent = true;
              break;
            }
          }
          if (keyNotPresent) {
            idsToRemove.push(codeInfoId);
            continue;
          }
          if (value !== currVal) {
            variant.values[codeInfoId] = newEVEntry();
            variant.values[codeInfoId].value = JSON.stringify(currVal);
          }
        }
      }

      console.log("new values", variant.values);

      console.log("idsToRemove", idsToRemove);
    }
  });
}

function isFromJsonSource(id) {
  return id && id.startsWith(C.JSON_SOURCE_PREFIX);
}
