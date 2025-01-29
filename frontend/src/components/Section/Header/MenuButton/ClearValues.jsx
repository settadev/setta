import { MenuItem } from "components/Utils/atoms/menubar/menudropdownitem";
import { maybeRunGuiToYaml } from "state/actions/guiToYaml";
import { getSectionInfo } from "state/actions/sectionInfos";
import { maybeIncrementProjectStateVersion } from "state/actions/undo";
import { useSectionInfos } from "state/definitions";
import { getParamUIType } from "state/hooks/uiTypes";
import { newEVEntry } from "utils/objs/ev";

export function ClearValues({ sectionId }) {
  function onClick() {
    const { variantId } = getSectionInfo(sectionId);

    useSectionInfos.setState((x) => {
      for (const k of Object.keys(x.variants[variantId].values)) {
        x.variants[variantId].values[k] = newEVEntry(
          getParamUIType(sectionId, k, x),
        );
      }
    });
    maybeIncrementProjectStateVersion(true);
    maybeRunGuiToYaml(sectionId, variantId);
  }

  return <MenuItem onClick={onClick}>Clear Values</MenuItem>;
}
