import { useModal } from "state/definitions";
import { MODAL_TYPE } from "utils/constants";

export function setModalOpen(open) {
  if (open) {
    useModal.setState({ open });
  } else {
    useModal.getState().reset();
  }
}

function openModal(modalType, modalData) {
  useModal.setState({ modalType, modalData, open: true });
}

export function openLoadModal() {
  openModal(MODAL_TYPE.LOAD_PROJECT_CONFIG);
}

export function openSaveAsModal() {
  openModal(MODAL_TYPE.SAVE_PROJECT_CONFIG_AS);
}

export function openSaveAsWithRefsModal() {
  openModal(MODAL_TYPE.SAVE_PROJECT_CONFIG_AS_WITH_REFS);
}

export function openExportJSONModal() {
  openModal(MODAL_TYPE.EXPORT_JSON);
}

export function openImportJSONModal() {
  openModal(MODAL_TYPE.IMPORT_JSON);
}

export function openDeleteProjectWarningModal(selectedProjects) {
  openModal(MODAL_TYPE.DELETE_PROJECT_WARNING, selectedProjects);
}

export function openRenameReferencesModal(...data) {
  openModal(MODAL_TYPE.RENAME_REFERENCES, data);
}

export function openDeleteJSONSourceFileModal(filepath) {
  openModal(MODAL_TYPE.DELETE_JSON_SOURCE_FILE, filepath);
}

export function openAddArtifactByFilepathModal(sectionId) {
  openModal(MODAL_TYPE.ADD_ARTIFACT_BY_FILEPATH, sectionId);
}
