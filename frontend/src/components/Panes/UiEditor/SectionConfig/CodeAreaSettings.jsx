import { IdNameCombobox } from "components/Utils/Combobox/IdNameCombobox";
import { useSectionInfos } from "state/definitions";

const startMethods = [
  {
    group: "Start Methods",
    items: ["fork", "spawn", "forkserver"].map((x) => ({ id: x, name: x })),
  },
];

export function CodeAreaSettings({ sectionId }) {
  const subprocessStartMethod = useSectionInfos(
    (x) => x.x[sectionId].subprocessStartMethod,
  );

  function setSubprocessStartMethod(v) {
    useSectionInfos.setState((state) => {
      state.x[sectionId].subprocessStartMethod = v;
    });
  }

  return (
    <div className="mb-2 mt-2 w-full select-text">
      <div className="flex w-full items-center gap-3">
        <p className="select-none  text-sm font-bold text-setta-400 dark:text-setta-600">
          Subprocess Start Method
        </p>
        <IdNameCombobox
          allItems={startMethods}
          value={subprocessStartMethod}
          onSelectedItemChange={setSubprocessStartMethod}
        />
      </div>
    </div>
  );
}
