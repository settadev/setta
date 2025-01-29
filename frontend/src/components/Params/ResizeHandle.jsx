import { SETTA_PREVENT_SECTION_ACTIVE_CSS } from "utils/constants";

export function ResizeHandle({ showResizeHandle, onMouseDown }) {
  return (
    <div className="section-center relative mx-auto h-[90%] w-0.5 rounded-sm group-hover/arg-group:bg-setta-500/15">
      {showResizeHandle && (
        <div
          className={`${SETTA_PREVENT_SECTION_ACTIVE_CSS} nopan nodrag group/resize absolute inset-y-0 left-1/2 -ml-2 flex w-4 cursor-col-resize items-center justify-center`}
          onMouseDown={onMouseDown}
        >
          <div className="h-[calc(100%-4px)] w-1.5 rounded bg-transparent hover:!bg-blue-500 group-hover/resize:bg-setta-200 group-hover/resize:dark:bg-setta-500" />
        </div>
      )}
    </div>
  );
}
