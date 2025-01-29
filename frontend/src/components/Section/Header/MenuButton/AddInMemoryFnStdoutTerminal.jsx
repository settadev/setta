import { MenuItem } from "components/Utils/atoms/menubar/menudropdownitem";
import { createAdjacentSection } from "state/actions/sections/createSections";
import { goToSection } from "state/actions/sections/sectionPositions";
import { useSectionInfos } from "state/definitions";
import { BASE_UI_TYPE_IDS } from "utils/constants";

export function AddInMemoryFnStdoutTerminal({ sectionId }) {
  function onClick(e) {
    const existingTerminalId =
      useSectionInfos.getState().singletonSections.inMemoryFnStdoutTerminal;

    if (existingTerminalId) {
      goToSection(existingTerminalId);
    } else {
      useSectionInfos.setState((state) => {
        createAdjacentSection(
          sectionId,
          {
            isReadOnlyTerminal: true,
            uiTypeId: BASE_UI_TYPE_IDS.TERMINAL,
          },
          state,
        );
      });
    }
  }

  return <MenuItem onClick={onClick}>Add Stdout Terminal</MenuItem>;
}
