import { SwitchInput } from "components/Params/ParamUIs/SwitchInput";
import { useSectionInfos } from "state/definitions";

export function GlobalParamSweepSettings({ sectionId }) {
  const renderMatrix = useSectionInfos((x) => x.x[sectionId].renderMatrix);

  async function onChange(v) {
    useSectionInfos.setState((state) => {
      state.x[sectionId].renderMatrix = v;
    });
  }

  return (
    <div className="flex w-full items-center justify-between gap-4 ">
      <p className="text-xs font-bold text-setta-700 dark:text-setta-300">
        Combination Matrix Mode
      </p>
      <SwitchInput
        value={renderMatrix}
        onChange={onChange}
        outerDivClassName="flex items-center"
      />
    </div>
  );
}
