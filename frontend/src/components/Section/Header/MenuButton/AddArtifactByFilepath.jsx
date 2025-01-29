import { MenuItem } from "components/Utils/atoms/menubar/menudropdownitem";
import { openAddArtifactByFilepathModal } from "state/actions/modal";

export function AddArtifactByFilepath({ sectionId }) {
  async function onClick() {
    openAddArtifactByFilepathModal(sectionId);
  }

  return <MenuItem onClick={onClick}>Add artifact by filepath</MenuItem>;
}
