import * as Dialog from "@radix-ui/react-dialog";
import { BiErrorCircle } from "react-icons/bi";
import { dbDeleteProjectConfigs } from "requests/projects";
import { setModalOpen } from "state/actions/modal";
import { useModal } from "state/definitions";

export function DeleteProjectWarningModal() {
  const { selectedProjects, setDoRefresh, setSelectedProjects } = useModal(
    (x) => x.modalData,
  );

  const handleCancel = () => {
    setModalOpen(false);
  };

  const handleConfirm = async () => {
    const res = await dbDeleteProjectConfigs(selectedProjects.map((x) => x.id));
    if (res.status === 200) {
      setDoRefresh(true);
      setSelectedProjects([]);
    }
    setModalOpen(false);
  };

  return (
    <div className="mx-auto flex h-full w-full flex-col items-center">
      <header className="flex flex-col gap-2 self-start">
        <div className="flex items-center gap-2">
          <BiErrorCircle className="h-6 w-6 rounded-full bg-red-100 p-0.5 text-red-600 dark:bg-red-700 dark:text-red-200" />
          <Dialog.Title className="text-xl font-semibold text-setta-800 dark:text-setta-200">
            Confirm Project Deletion
          </Dialog.Title>
        </div>
        <Dialog.Description className="mb-4 text-sm text-setta-600 dark:text-setta-300">
          This action cannot be undone. These projects will be permanently
          deleted.
        </Dialog.Description>
      </header>
      {/* Scrollable content section */}
      <div className="mb-6 w-full flex-grow overflow-auto rounded-lg bg-setta-50 p-4 dark:bg-setta-900">
        <h4 className="mb-2 text-sm font-medium text-setta-700 dark:text-setta-300">
          Projects to be deleted:
        </h4>
        <ul className="space-y-2">
          {selectedProjects.map((project) => (
            <li
              key={project.name}
              className="flex items-center space-x-2 text-sm text-setta-600 dark:text-setta-400"
            >
              <span className="h-2 w-2 flex-shrink-0 rounded-full bg-red-500" />
              <span>{project.name}</span>
            </li>
          ))}
        </ul>
      </div>
      {/* Fixed footer section */}
      <div className="flex w-full justify-end space-x-3 border-t border-setta-200 pt-4 dark:border-setta-700">
        <button
          onClick={handleCancel}
          className="cursor-pointer rounded-full border border-setta-300 px-4 py-2 text-setta-700 transition-colors hover:bg-setta-50 dark:border-setta-600 dark:text-setta-300 dark:hover:bg-setta-800"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          className="cursor-pointer rounded-full bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700 dark:hover:bg-red-800"
        >
          Delete Projects
        </button>
      </div>
    </div>
  );
}
