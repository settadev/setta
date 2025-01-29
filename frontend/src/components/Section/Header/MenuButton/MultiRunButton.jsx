import { MenuItem } from "components/Utils/atoms/menubar/menudropdownitem";
import { createAdjacentSection } from "state/actions/sections/createSections";
import { goToSection } from "state/actions/sections/sectionPositions";
import { createParamSweepSectionName } from "state/actions/uiTypes/utils";
import { useSectionInfos } from "state/definitions";
import { BASE_UI_TYPE_IDS } from "utils/constants";
import { createNewId } from "utils/idNameCreation";

export function MultirunButton({ sectionId }) {
  function onClick(e) {
    const { paramSweepSectionId } = useSectionInfos.getState().x[sectionId];
    if (paramSweepSectionId) {
      goToSection(paramSweepSectionId);
    } else {
      addParamSweepSection(sectionId);
    }
  }

  return <MenuItem onClick={onClick}>Add Param Sweep</MenuItem>;
}

function addParamSweepSection(sectionId) {
  const newSectionId = createNewId();

  useSectionInfos.setState((state) => {
    state.x[sectionId].paramSweepSectionId = newSectionId;

    createAdjacentSection(
      sectionId,
      {
        id: newSectionId,
        name: createParamSweepSectionName(state.x[sectionId].name),
        uiTypeId: BASE_UI_TYPE_IDS.PARAM_SWEEP,
      },
      state,
    );
  });
}
