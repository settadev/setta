import { MenuItem } from "components/Utils/atoms/menubar/menudropdownitem";
import { getSectionRect } from "forks/xyflow/core/utils/graph";
import { useSectionInfos } from "state/definitions";
import { SECTION_DISPLAY_MODES } from "utils/constants";

export function ShowYaml({ sectionId }) {
  const displayMode = useSectionInfos((x) => x.x[sectionId].displayMode);

  function onClick() {
    useSectionInfos.setState((state) => {
      const newDisplayMode =
        displayMode === SECTION_DISPLAY_MODES.YAML
          ? SECTION_DISPLAY_MODES.GUI
          : SECTION_DISPLAY_MODES.YAML;
      state.x[sectionId].displayMode = newDisplayMode;

      const { height: currHeight, width: currWidth } = state.x[sectionId].size;
      if (
        newDisplayMode === SECTION_DISPLAY_MODES.YAML &&
        (currHeight === "auto" || currWidth === "auto")
      ) {
        // This is to avoid flickering when in "auto" mode.
        // It gets set back to its original size in useCodeAreaHeight.
        state.x[sectionId].tempSavedSize = state.x[sectionId].size;
        const { width, height } = getSectionRect(sectionId);
        state.x[sectionId].size = { width, height };
      }
    });
  }

  return (
    <MenuItem onClick={onClick}>
      {displayMode === SECTION_DISPLAY_MODES.YAML ? "Show GUI" : "Show Yaml"}
    </MenuItem>
  );
}
