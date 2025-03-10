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
    <div className="mb-2 mt-2 flex w-full select-text flex-col gap-4">
      <div className="flex w-full items-center gap-3">
        <h3 className="select-none whitespace-nowrap text-sm font-bold text-setta-400 dark:text-setta-500">
          API Specs
        </h3>
        <input
          className="mr-[2px] w-full truncate rounded-full border border-solid border-setta-500 bg-white px-4 py-1 text-sm text-setta-700 focus-visible:border-blue-500 dark:bg-setta-900 dark:text-setta-400 dark:ring-setta-700"
          value={value}
          onChange={onChange}
          onBlur={onBlur}
        />
      </div>
      <div className="flex justify-end">
        <button
          className="mx-1 w-full cursor-pointer rounded-full bg-setta-600 px-4 py-2 text-center text-sm font-black text-white outline-none ring-0 hover:bg-blue-600 focus:outline-none focus-visible:outline-blue-600 dark:bg-setta-700 hover:dark:bg-blue-700"
          onClick={onClick}
        >
          Fetch API Specs
        </button>
      </div>
    </div>
  );
}
