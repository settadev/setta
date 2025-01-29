import { SaveLoadModal } from "components/Modals/SaveLoadModal/SaveLoadModal";
import { useEffect, useState } from "react";
import { saveKwargsAsCollection } from "state/actions/kwargs";
import { useModal } from "state/definitions";

export function SaveCustomArgumentsModal({ open, modalType }) {
  const [files, setFiles] = useState([]);

  useEffect(() => {
    // async function fn() {
    //   await getCollectionsAndModulesFn((x) => setFiles(Object.values(x)))();
    // }
    // if (open) {
    //   fn();
    // }
  }, [open]);

  function onClickSaveCustomArguments({ filename }) {
    const sectionId = useModal.getState().modalData;
    saveKwargsAsCollection({
      sectionId,
      name: filename,
    });
  }

  return (
    <SaveLoadModal
      modalPurpose={modalType.purpose}
      files={files}
      onClickActionButton={onClickSaveCustomArguments}
      title={modalType.title}
      buttonText={modalType.buttonText}
      placeholder="Collection Name"
    />
  );
}
