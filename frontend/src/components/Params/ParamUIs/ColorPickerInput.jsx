import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { tryParseJSON } from "utils/utils";

export function ColorPickerInputConfig({ onChange, config }) {
  const colors = config.colorChoices ?? [];

  const addColor = () => {
    const colorChoices = [...colors, { color: "#ff0000", description: "" }];
    onChange("colorChoices", () => colorChoices);
  };

  const removeColor = (removeIdx) => {
    const colorChoices = colors.filter((color, idx) => idx !== removeIdx);
    onChange("colorChoices", () => colorChoices);
  };

  const updateColor = (updateIdx, newColor) => {
    const colorChoices = colors.map((color, idx) =>
      idx === updateIdx ? { ...color, color: newColor } : color,
    );
    onChange("colorChoices", () => colorChoices);
  };

  const updateDescription = (updateIdx, description) => {
    const colorChoices = colors.map((color, idx) =>
      idx === updateIdx ? { ...color, description } : color,
    );
    onChange("colorChoices", () => colorChoices);
  };

  return (
    <AvailableColors
      colors={colors}
      addColor={addColor}
      removeColor={removeColor}
      updateColor={updateColor}
      updateDescription={updateDescription}
    />
  );
}

export const AvailableColors = ({
  colors,
  addColor,
  removeColor,
  updateColor,
  updateDescription,
}) => {
  return (
    <>
      <button
        onClick={addColor}
        className="my-1 flex cursor-pointer items-center justify-between rounded-xl bg-setta-100 px-3  py-0.5 uppercase text-setta-500 hover:bg-setta-200 dark:bg-setta-850 dark:text-setta-500 dark:hover:bg-setta-850"
        aria-label="Add color"
      >
        <p className="text-sm font-black ">Add Colors</p>
        <i className="gg-add !scale-90" />
      </button>

      <div className="flex flex-col gap-2 overflow-y-auto">
        {colors.map(({ color, description }, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <div className="flex flex-auto items-center gap-1 overflow-hidden">
              <input
                type="color"
                value={color}
                onChange={(e) => updateColor(idx, e.target.value)}
                className="min-h-6 min-w-6 cursor-pointer rounded-full !border !border-solid !border-setta-500/20 p-0 dark:!border-setta-500/40 [&::-moz-color-swatch]:rounded"
              />
              <input
                type="text"
                value={description}
                onChange={(e) => updateDescription(idx, e.target.value)}
                placeholder="Add description..."
                className="h-[calc(100%_-_2px)] w-[calc(100%_-_2px)] truncate rounded border px-2 py-1 text-xs text-setta-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-setta-400 dark:placeholder-setta-700"
              />
            </div>
            <button
              onClick={() => removeColor(idx)}
              className="flex cursor-pointer items-center rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              aria-label="Remove color"
            >
              <i className="gg-close !scale-75" />
            </button>
          </div>
        ))}
      </div>
    </>
  );
};

export function ColorPickerInput({
  colorChoices,
  value,
  onChange,
  onEscape,
  wrapperClassName,
  colorPickerChoicesClasses,
  isDisabled,
}) {
  const _value = tryParseJSON(value);
  return (
    <div className={wrapperClassName}>
      <ColorPicker
        colorChoices={colorChoices}
        value={_value}
        onChange={onChange}
        onEscape={onEscape}
        colorPickerChoicesClasses={colorPickerChoicesClasses}
        isDisabled={isDisabled}
      />
    </div>
  );
}

function ColorPicker({
  colorChoices,
  value,
  onChange,
  onEscape,
  colorPickerChoicesClasses,
  isDisabled,
}) {
  const style = {
    // from https://codepen.io/devongovett/pen/QwLbRrW
    "--bg": value,
    background: "var(--bg)",
    color: "lch(from var(--bg) calc((49.44 - l) * infinity) 0 0)",
  };
  return colorChoices?.length > 0 ? (
    <ColorPickerFromColorChoices
      color={value}
      setColor={onChange}
      colorChoices={colorChoices}
      colorPickerChoicesClasses={colorPickerChoicesClasses}
      isDisabled={isDisabled}
      onEscape={onEscape}
    />
  ) : (
    <>
      <i
        className="gg-color-picker single-cell-child pointer-events-none mr-0.5 mt-0.5 place-self-center"
        style={style}
      />
      <input
        id="colorPicker"
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="single-cell-child flex !h-[calc(100%_-_2px)] min-h-0 !w-[calc(100%_-_2px)]  min-w-0 cursor-pointer items-center justify-between overflow-hidden !rounded-lg !border !border-solid !border-setta-500/20 dark:!border-setta-500/40"
        disabled={isDisabled}
        onKeyDown={(e) => {
          if (e.code === "Escape") {
            onEscape?.();
          }
        }}
      />
    </>
  );
}

function ColorPickerFromColorChoices({
  color,
  setColor,
  colorChoices,
  colorPickerChoicesClasses,
  isDisabled,
  onEscape,
}) {
  let selectedItem = colorChoices.find((c) => c.color === color);
  if (!selectedItem) {
    selectedItem = colorChoices[0];
  }

  const style = {
    "--bg": selectedItem.color,
    background: "var(--bg)",
    color: "lch(from var(--bg) calc((49.44 - l) * infinity) 0 0)",
  };

  return (
    <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger
        className={colorPickerChoicesClasses}
        disabled={isDisabled}
        onKeyDown={(e) => {
          if (e.code === "Escape") {
            // have to stop propagation to prevent section from becoming unselected
            e.stopPropagation();
            onEscape?.();
          }
        }}
      >
        <div
          className="single-cell-child min-w-0s m-auto h-full min-h-0 w-full rounded-lg !border !border-solid !border-setta-500/20 dark:!border-setta-500/40"
          style={{ backgroundColor: selectedItem.color }}
        />
        <div className="single-cell-child flex items-center justify-between overflow-hidden">
          <p
            className="ml-[2px] truncate pl-2.5 text-xs font-semibold @[90px]:inline-block"
            style={style}
          >
            {selectedItem.description}
          </p>
          <i className="gg-chevron-down px-2" style={style} />
        </div>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="z-20 flex flex-col rounded bg-white p-2 shadow-md dark:bg-setta-800"
          align="start"
          style={{ minWidth: "var(--radix-dropdown-menu-trigger-width)" }}
        >
          {colorChoices.map((item, index) => (
            <DropdownMenu.Item
              key={index}
              className="flex cursor-pointer items-center rounded px-2 py-1 hover:bg-setta-100 dark:hover:bg-setta-700"
              onSelect={() => setColor(item.color)}
            >
              <div
                className="mr-2 h-4 w-4 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <p className="max-w-48 truncate text-xs text-setta-500 dark:text-setta-300">
                {item.description}
              </p>
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
