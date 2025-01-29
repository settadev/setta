import * as Dialog from "@radix-ui/react-dialog";
import { setModalOpen } from "state/actions/modal";
import { useModal } from "state/definitions";
import { MODAL_TYPE } from "utils/constants";
import { AddArtifactByFilepathModal } from "./AddArtifactByFilepathModal/AddArtifactByFilepathModal";
import { DeleteFileModal } from "./DeleteFileModal/DeleteFileModal";
import { DeleteProjectWarningModal } from "./DeleteProjectWarningModal/DeleteProjectWarningModal";
import { FileMenuLoadModal } from "./FileMenuModal/FileMenuLoadModal";
import { FileMenuSaveAsModal } from "./FileMenuModal/FileMenuSaveAsModal";
import {
  ExportJSONModal,
  ImportJSONModal,
} from "./ImportExportModal/ImportExportModal";
import { RenameReferencesModal } from "./RenameReferencesModal/RenameReferencesModal";
import { SaveUITypeConfigModal } from "./SaveUITypeConfigModal/SaveUITypeConfigModal";
import { SaveCustomArgumentsModal } from "./SectionSaveButtonModal/SaveCustomArgumentsModal";
import "./styles.css";

export function ModalContainer({ children }) {
  const open = useModal((x) => x.open);

  return (
    <Dialog.Root open={open} onOpenChange={setModalOpen}>
      {children}
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-20 animate-[overlayShow_150ms_cubic-bezier(0.16,_1,_0.3,_1)] bg-[rgba(0,0,0,0.5)] backdrop-blur-sm " />
        <Dialog.Content className="animate-[contentShow_150ms_cubic-bezier(0.16,_1,_ 0.3,_ 1) fixed left-1/2 top-1/2 z-[100] flex h-min max-h-[clamp(10rem,85vh,30rem)] min-h-0 w-[90vw] max-w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white px-7 pb-3 pt-7 shadow-xl dark:border dark:border-setta-600 dark:bg-setta-800">
          <ModalContent open={open} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function ModalContent({ open }) {
  const modalType = useModal((x) => x.modalType);

  if (!open) {
    return null;
  }

  switch (modalType.title) {
    case MODAL_TYPE.LOAD_PROJECT_CONFIG.title:
      return <FileMenuLoadModal open={open} modalType={modalType} />;
    case MODAL_TYPE.SAVE_PROJECT_CONFIG_AS.title:
    case MODAL_TYPE.SAVE_PROJECT_CONFIG_AS_WITH_REFS.title:
      return <FileMenuSaveAsModal open={open} modalType={modalType} />;
    case MODAL_TYPE.EXPORT_JSON.title:
      return <ExportJSONModal open={open} modalType={modalType} />;
    case MODAL_TYPE.IMPORT_JSON.title:
      return <ImportJSONModal modalType={modalType} />;
    case MODAL_TYPE.SAVE_UI_TYPE_CONFIG.title:
      return <SaveUITypeConfigModal open={open} modalType={modalType} />;
    case MODAL_TYPE.SAVE_CUSTOM_ARGUMENTS.title:
      return <SaveCustomArgumentsModal open={open} modalType={modalType} />;
    case MODAL_TYPE.DELETE_PROJECT_WARNING.title:
      return <DeleteProjectWarningModal open={open} />;
    case MODAL_TYPE.RENAME_REFERENCES.title:
      return <RenameReferencesModal open={open} />;
    case MODAL_TYPE.DELETE_JSON_SOURCE_FILE.title:
      return <DeleteFileModal open={open} />;
    case MODAL_TYPE.ADD_ARTIFACT_BY_FILEPATH.title:
      return <AddArtifactByFilepathModal open={open} />;
    default:
      return null;
  }
}
