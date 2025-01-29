import { useCodeMirrorStyleLoader } from "components/Utils/CodeMirror/useCodeMirrorStyleLoader";
import { FloatingBox } from "components/Utils/FloatingBox";
import { GridWrapper } from "components/Utils/GridWrapper";
import { useAddMouseLocationListener } from "forks/xyflow/core/utils/mouseLocation";
import { useEffect } from "react";
import { dbRequestTypeCheck } from "requests/sections";
import { initializeGlobalSectionColumnWidthEventListeners } from "state/actions/sectionColumnWidth";
import { useLoadProjectConfig } from "state/hooks/project";
import { restoreTerminals } from "state/hooks/terminals/terminal";
import { Overview } from "../../../components/Panes/Overview/Overview";
import { UiEditor } from "../../../components/Panes/UiEditor/UiEditor";
import { NotFound } from "../NotFound/NotFound";
import { UIPage } from "./UiPage";

export function MainContainer() {
  const [doneLoading, is404] = useLoadProjectConfig();
  useCodeMirrorStyleLoader(doneLoading, is404);
  useAddMouseLocationListener();

  useEffect(() => {
    if (doneLoading && !is404) {
      dbRequestTypeCheck();
      restoreTerminals();
      const cleanup = initializeGlobalSectionColumnWidthEventListeners();
      return cleanup;
    }
  }, [doneLoading, is404]);

  return (
    <>
      {!doneLoading && <LoadingSpinner />}
      {doneLoading && is404 ? (
        <NotFound />
      ) : (
        <>
          <Overview />
          <UiEditor />
          <GridWrapper>{doneLoading && <UIPage />}</GridWrapper>
          <FloatingBox />
        </>
      )}
    </>
  );
}

function LoadingSpinner() {
  return (
    <div className="single-cell-container absolute h-full w-full">
      <div
        className={`single-cell-child inset-0 place-self-center bg-transparent bg-opacity-50`}
      >
        <div className="gg-spinner !scale-150 before:!border-t-blue-500 after:!border-blue-500"></div>
      </div>
      <div className="relative z-10" />
    </div>
  );
}
