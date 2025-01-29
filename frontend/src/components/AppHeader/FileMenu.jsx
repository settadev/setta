import * as Menubar from "@radix-ui/react-menubar";
import { NavbarMenuDropdown } from "components/Utils/atoms/menubar/menudropdown";
import { MenuItem } from "components/Utils/atoms/menubar/menudropdownitem";
import _ from "lodash";
import { VscSave, VscSaveAs } from "react-icons/vsc";
import {
  openExportJSONModal,
  openImportJSONModal,
  openLoadModal,
  openSaveAsModal,
  openSaveAsWithRefsModal,
} from "state/actions/modal";
import { useCreateAndGoToProjectConfig } from "state/actions/project/loadProject";
import { saveProject } from "state/actions/project/saveProject";
import { useSettings } from "state/definitions";
import { shortcutPrettified } from "utils/utils";

export function FileMenu() {
  const shortcuts = useSettings((x) => {
    return {
      newProjectConfigShortcut: shortcutPrettified(
        x.shortcuts.newProjectConfigShortcut,
      ),
      saveShortcut: shortcutPrettified(x.shortcuts.saveShortcut),
      saveAsShortcut: shortcutPrettified(x.shortcuts.saveAsShortcut),
      loadShortcut: shortcutPrettified(x.shortcuts.loadShortcut),
      undoShortcut: shortcutPrettified(x.shortcuts.undoShortcut),
      groupShortcut: shortcutPrettified(x.shortcuts.groupShortcut),
    };
  }, _.isEqual);

  const createAndGoToProjectConfig = useCreateAndGoToProjectConfig();

  return (
    <NavbarMenuDropdown trigger="File">
      <MenuItem
        onClick={createAndGoToProjectConfig}
        shortcut={shortcuts.newProjectConfigShortcut}
      >
        New Config
      </MenuItem>
      <MenuItem onClick={openLoadModal} shortcut={shortcuts.loadShortcut}>
        Load
      </MenuItem>
      <MenuItem onClick={saveProject} shortcut={shortcuts.saveShortcut}>
        <VscSave />
        Save
      </MenuItem>
      <MenuItem onClick={openSaveAsModal} shortcut={shortcuts.saveAsShortcut}>
        <VscSaveAs />
        Save As
      </MenuItem>
      <MenuItem onClick={openSaveAsWithRefsModal}>
        <VscSaveAs />
        Save As (With Refs)
      </MenuItem>
      <Menubar.Separator className="dark: m-[5px] h-[1px] bg-setta-100 dark:bg-setta-600" />

      <MenuItem onClick={openImportJSONModal}>
        {/* <BiImport /> */}
        Import JSON
      </MenuItem>
      <MenuItem onClick={openExportJSONModal}>
        {/* <BiExport /> */}
        Export JSON
      </MenuItem>
    </NavbarMenuDropdown>
  );
}
