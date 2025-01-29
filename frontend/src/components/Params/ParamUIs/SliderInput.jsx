import * as Slider from "@radix-ui/react-slider";
import _ from "lodash";
import { useEffect, useState } from "react";
import { clamp } from "utils/utils";
import { SimpleConfig } from "./SimpleConfig";

export function SliderInputConfig({ onChange, config }) {
  const options = ["min", "max", "step"];
  const [localConfig, setLocalConfig] = useState(config);

  function localOnChange(configName, value) {
    setLocalConfig({ ...localConfig, [configName]: value });
  }

  function onBlur(configName, value) {
    const asNum = _.toNumber(value);
    if (
      value === "" ||
      !_.isFinite(asNum) ||
      !configMakesSense(configName, asNum, localConfig)
    ) {
      setLocalConfig(config);
      return;
    }
    onChange(configName, () => asNum);
  }

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  return (
    <SimpleConfig
      options={options}
      onChange={localOnChange}
      onBlur={onBlur}
      config={localConfig}
    />
  );
}

function configMakesSense(configName, newConfigVal, config) {
  let { step, min, max } = config;
  if (configName === "min") {
    min = newConfigVal;
  } else if (configName === "max") {
    max = newConfigVal;
  } else {
    step = newConfigVal;
  }
  return min < max && step <= max - min;
}

export function SliderInput({
  value,
  defaultVal,
  onChange,
  onEscape,
  onCommit,
  min,
  max,
  step,
  isDisabled,
  wrapperDivClass,
  sliderRootClassName,
  sliderTrackClassName,
  sliderRangeClassName,
  sliderThumbClassName,
  textInputClassName,
}) {
  return (
    <div className={wrapperDivClass}>
      <SliderOnly
        value={value}
        defaultVal={defaultVal}
        onChange={onChange}
        onCommit={onCommit}
        min={min}
        max={max}
        step={step}
        isDisabled={isDisabled}
        sliderRootClassName={sliderRootClassName}
        sliderTrackClassName={sliderTrackClassName}
        sliderRangeClassName={sliderRangeClassName}
        sliderThumbClassName={sliderThumbClassName}
      />
      <SliderTextField
        className={textInputClassName}
        value={value}
        onChange={onChange}
        onCommit={onCommit}
        onEscape={onEscape}
        min={min}
        max={max}
      />
    </div>
  );
}

function SliderTextField({
  className,
  value,
  onChange,
  onCommit,
  onEscape,
  min,
  max,
  step,
}) {
  const [tempValue, setTempValue] = useState(value);
  function localOnChange(e) {
    setTempValue(e.target.value);
  }

  function onBlur(e) {
    const num = _.toNumber(e.target.value);
    if (e.target.value === "" || !_.isFinite(num)) {
      setTempValue(value);
      return;
    }
    const clamped = clamp(num, min, max);
    setTempValue(clamped);
    onChange?.(clamped);
    onCommit?.(clamped);
  }

  useEffect(() => {
    setTempValue(value);
  }, [value]);

  return (
    <input
      className={className}
      value={tempValue}
      onChange={localOnChange}
      onBlur={onBlur}
      onKeyDown={(e) => {
        if (e.code === "Escape") {
          onEscape?.();
        }
      }}
    />
  );
}

function SliderOnly({
  value,
  defaultVal,
  onChange,
  onCommit,
  min,
  max,
  step,
  isDisabled,
  sliderRootClassName,
  sliderTrackClassName,
  sliderRangeClassName,
  sliderThumbClassName,
}) {
  const asNum = _.toNumber(value);
  const valueNum = isNaN(asNum) ? min : clamp(_.toNumber(value), min, max);

  return (
    <Slider.Root
      className={sliderRootClassName}
      value={[valueNum]}
      defaultValue={[defaultVal]}
      min={min}
      max={max}
      step={step}
      disabled={isDisabled}
      onValueChange={(v) => onChange?.(v[0])}
      onValueCommit={(v) => onCommit?.(v[0])}
    >
      <Slider.Track className={sliderTrackClassName}>
        <Slider.Range className={sliderRangeClassName} />
      </Slider.Track>
      <Slider.Thumb className={sliderThumbClassName} />
    </Slider.Root>
  );
}
