import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";
import { VscReferences } from "react-icons/vsc";
import { dbSaveSettings } from "requests/settings";
import { setModalOpen } from "state/actions/modal";
import { makeReplacements } from "state/actions/referenceRenaming";
import { useModal, useSettings } from "state/definitions";
import { RENAME_REFERENCES_ON_SECTION_MOVE_MODES } from "utils/constants";

export function RenameReferencesModal() {
  const modalData = useModal((x) => x.modalData);

  const [doNotAsk, setDoNotAsk] = useState(false);

  const handleCancel = () => {
    setModalOpen(false);
    if (doNotAsk) {
      useSettings.setState((state) => ({
        backend: {
          ...state.backend,
          renameReferencesOnSectionMoveMode:
            RENAME_REFERENCES_ON_SECTION_MOVE_MODES.NEVER_RENAME,
        },
      }));

      dbSaveSettings(useSettings.getState());
    }
  };

  const handleConfirm = async () => {
    if (doNotAsk) {
      useSettings.setState((state) => ({
        backend: {
          ...state.backend,
          renameReferencesOnSectionMoveMode:
            RENAME_REFERENCES_ON_SECTION_MOVE_MODES.ALWAYS_RENAME,
        },
      }));

      dbSaveSettings(useSettings.getState());
    }
    await makeReplacements(...modalData);
    setModalOpen(false);
  };

  return (
    <div className="mx-auto flex h-full w-full flex-col items-center">
      <header className="flex flex-col gap-2 self-start">
        <div className="flex items-center gap-2">
          <VscReferences className="h-6 w-6 rounded-sm p-0.5 text-setta-600  dark:text-setta-200" />
          <Dialog.Title className="text-xl font-semibold text-setta-800 dark:text-setta-200">
            Rename References
          </Dialog.Title>
        </div>
        <Dialog.Description className="mb-4 text-sm text-setta-600 dark:text-setta-300">
          The section you moved is referenced to by other sections. Would you
          like to update those references?
        </Dialog.Description>
      </header>
      {/* Scrollable content section */}
      {/* <div className="mb-6 w-full flex-grow overflow-auto rounded-lg bg-setta-50 p-4 dark:bg-setta-900">
        <h4 className="mb-2 text-sm font-medium text-setta-700 dark:text-setta-300">
          References to be updated:
        </h4>
        <ul className="space-y-2">
          {referencesToBeUpdated.map((r) => (
            <li
              key={r}
              className="flex items-center space-x-2 text-sm text-setta-600 dark:text-setta-400"
            >
              <span className="h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </div> */}
      {/* Fixed footer section */}
      <div className="flex w-full flex-col space-y-3 border-t border-setta-200 pt-4 dark:border-setta-700">
        <label className="flex items-center space-x-2 text-sm text-setta-600 dark:text-setta-400">
          <input
            type="checkbox"
            className="h-4 w-4 cursor-pointer rounded bg-setta-100 text-blue-600 checked:!bg-blue-500 focus:ring-1  dark:bg-setta-700"
            onChange={(e) => {
              setDoNotAsk(e.target.checked);
            }}
          />
          <span>Don&apos;t ask again</span>
        </label>
        <div className="flex w-full justify-end space-x-3">
          <button
            onClick={handleCancel}
            className="cursor-pointer rounded-full border border-setta-300 px-4 py-2 text-setta-700 transition-colors hover:bg-setta-50 dark:border-setta-600 dark:text-setta-300 dark:hover:bg-setta-800"
          >
            Don&apos;t Update
          </button>
          <button
            onClick={handleConfirm}
            className="cursor-pointer rounded-full bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 dark:hover:bg-blue-800"
          >
            Update References
          </button>
        </div>
      </div>
    </div>
  );
}
