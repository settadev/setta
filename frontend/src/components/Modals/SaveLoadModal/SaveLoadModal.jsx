import { DialogCloseButton } from "components/Utils/atoms/dialog/dialogCloseButton";
import { useState } from "react";
import { setModalOpen } from "state/actions/modal";
import { MODAL_PURPOSE } from "utils/constants";
import { FileExplorer } from "./FileExplorer";
import { FileNameInput } from "./FileNameInput";

export function SaveLoadModal({
  modalPurpose,
  files,
  onClickActionButton,
  title,
  buttonText,
  placeholder,
}) {
  const [selected, setSelected] = useState(null);
  const [filename, setFilename] = useState("");

  function getFilenameFromId(id) {
    return files.find((f) => f.id === id)?.name ?? "";
  }

  function onFilenameChange(v) {
    setFilename(v);
    setSelected(files.find((f) => f.name === v)?.id ?? null);
  }

  function onSelectedChange(v) {
    setSelected(v);
    setFilename(getFilenameFromId(v));
  }

  function onClose() {
    setSelected(null);
    setFilename("");
  }

  function onButtonClick() {
    onClickActionButton({ selected, filename });
    onClose();
  }

  function onFileDoubleClick(id) {
    onClickActionButton({ selected: id, filename: getFilenameFromId(id) });
    setModalOpen(false);
    onClose();
  }

  return (
    <div className="grid flex-grow grid-rows-[min-content_min-content_1fr_min-content] overflow-hidden">
      <Body
        modalPurpose={modalPurpose}
        files={files}
        selected={selected}
        onSelectedChange={onSelectedChange}
        onFileDoubleClick={onFileDoubleClick}
        onFilenameChange={onFilenameChange}
        filename={filename}
        title={title}
        placeholder={placeholder}
      />
      <Footer
        buttonText={buttonText}
        onClose={onClose}
        onClick={onButtonClick}
      />
    </div>
  );
}

function Body({
  modalPurpose,
  files,
  selected,
  onSelectedChange,
  onFileDoubleClick,
  onFilenameChange,
  filename,
  title,
  placeholder,
}) {
  return (
    <>
      <FileExplorer
        files={files}
        selected={selected}
        onSelectedChange={onSelectedChange}
        onFileDoubleClick={onFileDoubleClick}
        title={title}
      />
      {modalPurpose === MODAL_PURPOSE.SAVE && (
        // <div className="px-3">
        <FileNameInput
          placeholder={placeholder}
          value={filename}
          onChange={onFilenameChange}
        />
        // </div>
      )}
    </>
  );
}

export function Footer({ onClose, onClick, buttonText }) {
  return (
    <div className="mb-2 mt-4 flex justify-end gap-2">
      {buttonText && (
        <DialogCloseButton
          twClasses="bg-setta-200 dark:bg-setta-850 hover:bg-setta-300 dark:hover:bg-setta-900 text-setta-600 dark:text-setta-200 hover:cursor-pointer"
          onClick={onClick}
        >
          {buttonText}
        </DialogCloseButton>
      )}

      <DialogCloseButton
        twClasses="border border-solid border-setta-200 dark:border-setta-800 text-setta-400 hover:border-setta-500 hover:text-setta-600 dark:hover:text-setta-200 dark:hover:bg-setta-900 hover:cursor-pointer"
        onClick={onClose}
      >
        Close
      </DialogCloseButton>
    </div>
  );
}
