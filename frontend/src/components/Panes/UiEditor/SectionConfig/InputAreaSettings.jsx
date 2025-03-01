import { useEffect, useState } from "react";
import { dbCreateFile } from "requests/jsonSource";
import { loadJsonContents } from "state/actions/jsonSource";
import { updateSectionInfos } from "state/actions/sectionInfos";
import { useSectionInfos } from "state/definitions";
import { useFileExists } from "state/hooks/utils";

// TODO: enable this stuff again, but it should show jsonSourceGlob I guess
export function InputAreaSettings({ sectionId }) {
  const { fileExists, debouncedCheckIfFileExists } = useFileExists(200);

  const jsonSource = useSectionInfos((x) => x.x[sectionId].jsonSource);

  const [value, setValue] = useState(jsonSource ?? "");

  function onChange(e) {
    setValue(e.target.value);
    debouncedCheckIfFileExists(e.target.value);
  }

  async function onBlur(jsonSource) {
    const { sections, sectionVariants, codeInfo, codeInfoCols } =
      await loadJsonContents({ [sectionId]: jsonSource });
    useSectionInfos.setState((state) => {
      state.x[sectionId].jsonSource = jsonSource;
      updateSectionInfos({
        sections,
        sectionVariants,
        codeInfo,
        codeInfoCols,
        state,
      });
    });
  }

  useEffect(() => {
    setValue(jsonSource ?? "");
    debouncedCheckIfFileExists(jsonSource);
  }, [jsonSource]);

  async function onClickCreateJSON() {
    if (value) {
      const res = await dbCreateFile(value);
      if (res.status === 200) {
        onBlur(value);
      }
    }
  }

  return (
    <div className="mb-2 mt-2 w-full select-text">
      <div className="flex w-full items-center gap-3">
        <p className="select-none  text-sm font-bold text-setta-400 dark:text-setta-600">
          JSON Source
        </p>
        <input
          className="mr-[2px] w-full truncate rounded-full bg-white px-4 py-1 text-sm text-setta-700 ring-2 ring-setta-200 focus:ring-2 focus:ring-blue-500 dark:bg-setta-900 dark:text-setta-400 dark:ring-setta-700"
          value={value}
          onChange={onChange}
          onBlur={(e) => onBlur(e.target.value)}
        />
      </div>
      <div className="flex justify-end">
        <button
          disabled={fileExists}
          className="rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          onClick={onClickCreateJSON}
        >
          Create JSON File
        </button>
      </div>
    </div>
  );
}
