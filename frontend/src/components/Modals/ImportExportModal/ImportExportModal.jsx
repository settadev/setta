import * as Dialog from "@radix-ui/react-dialog";
import { Footer } from "components/Modals/SaveLoadModal/SaveLoadModal";
import { setViewport } from "forks/xyflow/core/hooks/useViewportHelper";
import { useEffect, useState } from "react";
import { HiOutlineDuplicate } from "react-icons/hi";
import { dbAddDefaultDataForJSONImport } from "requests/projects";
import { loadProjectState } from "state/actions/project/loadProject";
import { useSectionInfos } from "state/definitions";
import { useExportProjectJson } from "state/hooks/project";
import { resetProjectStores } from "state/utils";

export function ExportJSONModal({ open, modalType }) {
  const [projectJson, exportProjectJson] = useExportProjectJson();

  useEffect(() => {
    if (open) {
      exportProjectJson();
    }
  }, [open]);

  const value = JSON.stringify(projectJson, null, 2);

  return (
    <TextAreaModal
      value={value}
      title={modalType.title}
      copyBtn={true}
      onClickCopyBtn={() => navigator.clipboard.writeText(value)}
    />
  );
}

export function ImportJSONModal({ modalType }) {
  const [value, setValue] = useState("");

  async function onClick() {
    const project = JSON.parse(value);
    // replace id and name with current project config's id and name.
    const { id, name } = useSectionInfos.getState().projectConfig;
    project["projectConfig"] = { ...project["projectConfig"], id, name };
    const res = await dbAddDefaultDataForJSONImport(project);
    if (res.status === 200) {
      resetProjectStores();
      loadProjectState(res.data);
      const { viewport } = res.data.projectConfig;
      if (viewport) {
        // we have to set transform using the existing d3Zoom
        // because the page isn't reloading so the d3Zoom isn't getting re-initialized.
        // If we don't do this, then the d3Zoom will still be in its previous state
        // so the x,y,zoom will reset to where it was as soon as there is any interaction.
        setViewport(viewport);
      }
    }
  }

  return (
    <TextAreaModal
      value={value}
      setValue={setValue}
      title={modalType.title}
      disabled={false}
      buttonText={modalType.buttonText}
      onClick={onClick}
    />
  );
}

function TextAreaModal({
  value,
  setValue,
  title,
  disabled = true,
  copyBtn = false,
  onClickCopyBtn,
  buttonText = null,
  onClick,
}) {
  return (
    <div className="flex h-full flex-grow flex-col  ">
      <Dialog.Title className="mx-3 mb-4 font-bold uppercase tracking-widest text-setta-400">
        {title}
      </Dialog.Title>
      <article className="relative flex flex-grow overflow-hidden rounded-lg border border-setta-100 bg-setta-50 p-4  dark:border-setta-700/50 dark:bg-setta-900 dark:text-setta-300">
        {copyBtn && (
          <HiOutlineDuplicate
            className="absolute right-8 top-4 h-5 w-5 cursor-pointer text-setta-300 hover:text-setta-600 dark:hover:text-white"
            onClick={onClickCopyBtn}
          />
        )}
        <textarea
          disabled={disabled}
          className="overflow-y min-h-[30vh] flex-grow resize-none bg-transparent font-mono text-xs outline-none"
          value={value}
          onChange={(v) => setValue(v.target.value)}
          placeholder="JSON, state 'em..."
        />
      </article>
      <Footer buttonText={buttonText} onClick={onClick} />
    </div>
  );
}
