import { useEffect, useState } from "react";
import { dbFetchAPISpecs } from "requests/apiSpecs";
import { useSectionInfos } from "state/definitions";

// TODO: enable this stuff again, but it should show jsonSourceGlob I guess
export function APIAreaSettings({ sectionId }) {
  const apiSpecsURL = useSectionInfos((x) => x.x[sectionId].apiSpecsURL);
  const [value, setValue] = useState(apiSpecsURL ?? "");

  function onChange(e) {
    setValue(e.target.value);
  }

  function onBlur() {
    useSectionInfos.setState((state) => {
      state.x[sectionId].apiSpecsURL = value;
    });
  }

  useEffect(() => {
    setValue(apiSpecsURL ?? "");
  }, [apiSpecsURL]);

  async function onClick() {
    await dbFetchAPISpecs(value);
  }

  return (
    <div className="mb-2 mt-2 w-full select-text">
      <div className="flex w-full items-center gap-3">
        <p className="select-none  text-sm font-bold text-setta-400 dark:text-setta-600">
          API Specs
        </p>
        <input
          className="mr-[2px] w-full truncate rounded-full bg-white px-4 py-1 text-sm text-setta-700 ring-2 ring-setta-200 focus:ring-2 focus:ring-blue-500 dark:bg-setta-900 dark:text-setta-400 dark:ring-setta-700"
          value={value}
          onChange={onChange}
          onBlur={onBlur}
        />
      </div>
      <div className="flex justify-end">
        <button
          className="rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          onClick={onClick}
        >
          Fetch API Specs
        </button>
      </div>
    </div>
  );
}
