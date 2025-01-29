import { useEffect, useState } from "react";
import { dbLoadSectionJSONSource } from "requests/jsonSource";
import { updateSectionInfos } from "state/actions/sectionInfos";
import { useSectionInfos } from "state/definitions";

export function InputAreaSettings({ sectionId }) {
  const jsonSource = useSectionInfos((x) => x.x[sectionId].jsonSource);

  const [value, setValue] = useState(jsonSource ?? "");
  async function onBlur(e) {
    const jsonSource = e.target.value;
    let codeInfo = null,
      codeInfoCols = null,
      sectionVariants = null,
      sections = null;
    if (jsonSource) {
      const res = await dbLoadSectionJSONSource(sectionId, jsonSource);
      if (res.status === 200) {
        ({ codeInfo, codeInfoCols, sectionVariants, sections } =
          res.data.project);
      }
    }
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
  }, [jsonSource]);

  return (
    <div className="mb-2 mt-2 w-full select-text">
      <div className="flex w-full items-center gap-3">
        <p className="select-none  text-sm font-bold text-setta-400 dark:text-setta-600">
          JSON Source
        </p>
        <input
          className="mr-[2px] w-full truncate rounded-full bg-white px-4 py-1 text-sm text-setta-700 ring-2 ring-setta-200 focus:ring-2 focus:ring-blue-500 dark:bg-setta-900 dark:text-setta-400 dark:ring-setta-700"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={onBlur}
        />
      </div>
    </div>
  );
}
