import { MenuItem } from "components/Utils/atoms/menubar/menudropdownitem";
import { maybeRunGuiToYaml } from "state/actions/guiToYaml";
import {
  getSectionInfo,
  resetSectionsToDefaultVersions,
} from "state/actions/sectionInfos";

export function ResetToDefaultVersion({ sectionId }) {
  function onClick() {
    resetSectionsToDefaultVersions([sectionId]);
    // get variantId after the reset
    const { variantId } = getSectionInfo(sectionId);
    maybeRunGuiToYaml(sectionId, variantId);
  }

  return <MenuItem onClick={onClick}>Reset To Default Version</MenuItem>;
}
