import { MenuItem } from "components/Utils/atoms/menubar/menudropdownitem";
import { createNewVersionMaybeWithJSON } from "state/actions/newVersion";

export function CreateNewVersionButton({ sectionId }) {
  async function onClick() {
    createNewVersionMaybeWithJSON(sectionId);
  }

  return <MenuItem onClick={onClick}>New Version</MenuItem>;
}
