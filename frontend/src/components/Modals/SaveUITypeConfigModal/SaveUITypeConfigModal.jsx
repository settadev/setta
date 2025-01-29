import C from "constants/constants.json";
import { useEffect, useState } from "react";
import { cloneNewUIType } from "state/actions/uiTypes/cloneUITypes";
import { setParamUITypeId } from "state/actions/uiTypes/setParamUITypeId";
import { deleteUIType } from "state/actions/uiTypes/uiTypes";
import { isPreset, isUserPreset } from "state/actions/uiTypes/utils";
import { useSectionInfos } from "state/definitions";
import { SaveLoadModal } from "../SaveLoadModal/SaveLoadModal";

export function SaveUITypeConfigModal({ open, modalType }) {
  const [files, setFiles] = useState([]);

  useEffect(() => {
    if (open) {
      const uiTypes = Object.values(useSectionInfos.getState().uiTypes).filter(
        isUserPreset,
      );
      setFiles(uiTypes);
    }
  }, [open]);

  function onSaveAsSubmit({ filename }) {
    const newUIType = cloneNewUIType({
      uiType,
      name: filename,
      presetType: C.PRESET_UI_TYPE_USER,
    });
    setParamUITypeId({
      uiTypeId: newUIType.id,
      sectionId,
      paramInfoId,
    });
    // delete old uitype if its a non-preset
    if (!isPreset(uiType)) {
      deleteUIType(uiType.id);
    }
  }

  return (
    <SaveLoadModal
      modalPurpose={modalType.purpose}
      files={files}
      onClickActionButton={onSaveAsSubmit}
      title={modalType.title}
      buttonText={modalType.buttonText}
      placeholder="Preset Name"
    />
  );
}
