import * as Dialog from "@radix-ui/react-dialog";
import C from "constants/constants.json";
import { useState } from "react";
import { dbLoadArtifactFromDisk } from "requests/artifacts";
import {
  addArtifactAndMaybeCreateNewArtifactGroup,
  prepareArtifactForRendering,
} from "state/actions/artifacts";
import { setModalOpen } from "state/actions/modal";
import { getSectionType } from "state/actions/sectionInfos";
import { useModal } from "state/definitions";
import { useFileExists } from "state/hooks/utils";

export function AddArtifactByFilepathModal() {
  const sectionId = useModal((x) => x.modalData);
  const [filepath, setFilepath] = useState("");
  const { fileExists, debouncedCheckIfFileExists } = useFileExists(200);

  const handleInputChange = (e) => {
    setFilepath(e.target.value);
    debouncedCheckIfFileExists(e.target.value);
  };

  const handleCancel = () => {
    setModalOpen(false);
  };

  const shouldCreateNewArtifactGroup = () => {
    return getSectionType(sectionId) === C.DRAW;
  };

  const getArtifactType = () => {
    switch (getSectionType(sectionId)) {
      case C.DRAW:
      case C.IMAGE:
        return "img";
      case C.CHART:
        return "list";
    }
  };

  const handleConfirm = async () => {
    if (filepath) {
      const artifactType = getArtifactType();
      const res = await dbLoadArtifactFromDisk(filepath, artifactType);
      if (res.status === 200) {
        const value = await prepareArtifactForRendering(
          artifactType,
          res.data.value,
        );
        addArtifactAndMaybeCreateNewArtifactGroup({
          sectionId,
          createNewArtifactGroup: shouldCreateNewArtifactGroup(),
          value,
          artifactType,
          path: filepath,
        });
      }
    }
    setModalOpen(false);
  };

  return (
    <div className="mx-auto flex h-full w-full flex-col items-center">
      <header className="flex flex-col gap-2 self-start">
        <Dialog.Title className="text-xl font-semibold text-setta-800 dark:text-setta-200">
          Add Artifact by Filepath
        </Dialog.Title>
        <Dialog.Description className="mb-4 text-sm text-setta-600 dark:text-setta-300">
          Enter the filepath of the artifact you want to add
        </Dialog.Description>
      </header>

      <div
        className={`mb-4 flex w-full ${!fileExists ? "outline-red-500" : ""}`}
      >
        <input
          type="text"
          value={filepath}
          onChange={handleInputChange}
          placeholder="Enter filepath..."
          className={`flex-1 rounded-md border px-3 py-2 text-setta-800 dark:bg-setta-800 dark:text-setta-200 ${
            fileExists
              ? "border-setta-300 dark:border-setta-600"
              : "border-red-500 ring-1 ring-red-500"
          }`}
        />
      </div>

      <div className="flex w-full justify-end space-x-3 border-t border-setta-200 pt-4 dark:border-setta-700">
        <button
          onClick={handleCancel}
          className="cursor-pointer rounded-full border border-setta-300 px-4 py-2 text-setta-700 transition-colors hover:bg-setta-50 dark:border-setta-600 dark:text-setta-300 dark:hover:bg-setta-800"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          className="cursor-pointer rounded-full bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 dark:hover:bg-blue-800"
        >
          Add Artifact
        </button>
      </div>
    </div>
  );
}
