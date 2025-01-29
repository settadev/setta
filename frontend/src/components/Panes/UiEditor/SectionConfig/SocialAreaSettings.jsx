import { useState } from "react";
import { useSectionInfos } from "state/definitions";

export function SocialAreaSettings({ sectionId }) {
  const url = useSectionInfos((x) => x.x[sectionId].social);

  const [value, setValue] = useState(url ?? "");
  function onBlur(e) {
    const blurValue = e.target.value;
    if (blurValue) {
      useSectionInfos.setState((state) => {
        state.x[sectionId].social = blurValue;
      });
    }
  }

  return (
    <div className="mb-2 mt-2 w-full select-text">
      <div className="flex w-full items-center gap-3">
        <p className="select-none  text-sm font-bold text-setta-400 dark:text-setta-600">
          Social Media URL
        </p>
        <input
          className="mr-[2px] w-full truncate rounded-full bg-white px-4 py-1 text-sm text-setta-700 ring-2 ring-setta-200 focus:ring-2 focus:ring-blue-500 dark:bg-setta-900 dark:text-setta-400 dark:ring-setta-700"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={onBlur}
          placeholder="https://www.youtube.com/"
        />
      </div>
    </div>
  );
}
