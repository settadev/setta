import { StandardInput } from "components/Utils/atoms/input/StandardInput";

export function SimpleConfig({ options, onChange, onBlur, config }) {
  return (
    <div className="mt-1 flex flex-col">
      {options.map((e, idx) => (
        <div
          className="flex flex-grow items-center justify-between rounded-full px-3 py-[0.33rem] hover:bg-[#cbd5e02b]"
          key={`SimpleConfig-${idx}`}
        >
          <p className="flex-1 font-sans text-xs font-semibold text-setta-600">
            {e}
          </p>
          <StandardInput
            twClasses="justify-end"
            placeholder={e}
            key={`${e}-${idx}`}
            onChange={(v) => onChange(e, v.target.value)}
            onBlur={(v) => onBlur(e, v.target.value)}
            value={config[e]}
          />
        </div>
      ))}
    </div>
  );
}
